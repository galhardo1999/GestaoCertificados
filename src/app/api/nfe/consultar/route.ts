import { NextResponse } from 'next/server';
import https from 'https';
import axios from 'axios';
import zlib from 'zlib';
import { parseStringPromise } from 'xml2js';
import { prisma } from '@/lib/prisma';
import { getSignedDownloadUrl } from '@/lib/s3';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { clientId, accessKey, password } = await req.json();

        if (!clientId || !accessKey || !password) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        // 1. Buscar o certificado do cliente
        const client = await prisma.cliente.findUnique({
            where: { id: clientId },
            include: {
                certificados: {
                    where: { status: 'ATIVO' },
                    orderBy: { dataVencimento: 'desc' },
                    take: 1
                }
            }
        });

        if (!client || client.certificados.length === 0) {
            return NextResponse.json({ error: 'Cliente não possui certificado ativo' }, { status: 404 });
        }

        const certificate = client.certificados[0];

        // 2. Baixar o arquivo PFX do S3
        const downloadUrl = await getSignedDownloadUrl(certificate.chaveArquivo);
        const pfxResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const pfx = pfxResponse.data;

        // 3. Configurar o agente HTTPS com o certificado
        const agent = new https.Agent({
            pfx,
            passphrase: password,
            rejectUnauthorized: false,
        });

        // 4. Montar o XML (consChNFe)
        const ambiente = "1"; // 1 = Produção
        const ufAutor = "35"; // SP (Pode ser dinâmico se tiver no cadastro do cliente, mas geralmente SP responde pelo ambiente nacional)
        // Na verdade, para consChNFe, o serviço é NFeConsultaProtocolo?
        // O usuário pediu "Consultar NFe" e forneceu código de "distDFeInt".
        // Se ele quer consultar pela CHAVE, o serviço correto no distDFeInt é usando a tag <consChNFe> dentro do distDFeInt?
        // Sim, distDFeInt suporta consChNFe.

        const xmlDistDFe = `<distDFeInt versao="1.35" xmlns="http://www.portalfiscal.inf.br/nfe"><tpAmb>${ambiente}</tpAmb><cUFAutor>${ufAutor}</cUFAutor><CNPJ>${client.cnpj.replace(/\D/g, '')}</CNPJ><consChNFe><chNFe>${accessKey}</chNFe></consChNFe></distDFeInt>`;

        // 5. Envelope SOAP
        const soapXML = `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Body>
        <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
          <nfeDadosMsg>${xmlDistDFe}</nfeDadosMsg>
        </nfeDistDFeInteresse>
      </soap12:Body>
    </soap12:Envelope>`;

        // 6. Envio para SEFAZ
        const urlSefaz = 'https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx';

        const response = await axios.post(urlSefaz, soapXML, {
            headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
            httpsAgent: agent,
        });

        // 7. Tratamento da Resposta
        const resultParsed = await parseStringPromise(response.data, { explicitArray: false, ignoreAttrs: true });

        // Navegação segura no objeto
        const envelope = resultParsed['soap:Envelope'] || resultParsed['soap12:Envelope'];
        const body = envelope['soap:Body'] || envelope['soap12:Body'];
        const responseBody = body['nfeDistDFeInteresseResponse'];
        const result = responseBody['nfeDistDFeInteresseResult'];
        const retornoSefaz = result['retDistDFeInt'];

        if (retornoSefaz.cStat !== '138') {
            return NextResponse.json({
                success: false,
                message: retornoSefaz.xMotivo,
                cStat: retornoSefaz.cStat
            });
        }

        // Se tiver documentos
        let docsZip = retornoSefaz.loteDistDFeInt?.docZip;
        if (!docsZip) {
            return NextResponse.json({
                success: false,
                message: 'Nenhum documento encontrado para esta chave.'
            });
        }

        if (!Array.isArray(docsZip)) docsZip = [docsZip];

        const documentosProcessados = docsZip.map((doc: any) => {
            const buffer = Buffer.from(doc._ || doc, 'base64');
            const xmlString = zlib.gunzipSync(buffer).toString('utf-8');
            return {
                nsu: doc.NSU,
                schema: doc.schema,
                xml: xmlString
            };
        });

        return NextResponse.json({
            success: true,
            docs: documentosProcessados
        });

    } catch (error: any) {
        console.error('Erro na consulta NFe:', error);
        return NextResponse.json({
            error: 'Erro ao consultar NFe',
            details: error.message
        }, { status: 500 });
    }
}

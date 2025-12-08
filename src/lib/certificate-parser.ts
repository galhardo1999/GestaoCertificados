import * as forge from 'node-forge'

export interface CertificateMetadata {
    holderName: string
    expirationDate: Date
    issuer: string
    serialNumber: string
    subject: {
        commonName?: string
        organizationName?: string
        countryName?: string
        [key: string]: string | undefined
    }
    cnpj?: string
    companyName?: string
}

/**
 * Analisar um arquivo .pfx (PKCS#12) e extrair metadados do certificado
 * @param fileBuffer - O arquivo .pfx como um Buffer
 * @param password - A senha para descriptografar o arquivo .pfx (opcional para alguns certificados)
 * @returns Metadados do certificado, incluindo data de validade e nome do titular
 */
export async function parseCertificate(
    fileBuffer: Buffer,
    password?: string
): Promise<CertificateMetadata> {
    try {
        // Converter Buffer para string binária
        const binaryString = fileBuffer.toString('binary')

        // Analisar PKCS#12
        const p12Asn1 = forge.asn1.fromDer(binaryString)
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '')

        // Obter o certificado do PKCS#12
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
        const certBag = certBags[forge.pki.oids.certBag]

        if (!certBag || certBag.length === 0) {
            throw new Error('No certificate found in the .pfx file')
        }

        const certificate = certBag[0].cert
        if (!certificate) {
            throw new Error('Invalid certificate in .pfx file')
        }

        // Extrair informações do sujeito
        const subject = certificate.subject.attributes.reduce((acc, attr) => {
            const name = attr.name || attr.type
            if (name) {
                acc[name] = String(attr.value || '')
            }
            return acc
        }, {} as Record<string, string>)

        // Extrair informações do emissor
        const issuer = certificate.issuer.attributes
            .map(attr => `${attr.name || attr.type}=${attr.value}`)
            .join(', ')

        // Obter o nome do titular (Nome Comum ou Nome da Organização)
        const holderName =
            subject.commonName ||
            subject.organizationName ||
            subject.CN ||
            subject.O ||
            'Unknown'

        // Obter data de validade
        const expirationDate = certificate.validity.notAfter

        // Obter número de série
        const serialNumber = certificate.serialNumber

        // --- Lógica de Extração de CNPJ ---
        let cnpj = ''

        // 1. Tentar encontrar pelo OID 2.16.76.1.3.3 (CNPJ ICP-Brasil)
        // Nota: node-forge pode não mapear este OID para um nome, então verificamos o tipo/oid
        const cnpjAttribute = certificate.subject.attributes.find(attr =>
            attr.type === '2.16.76.1.3.3' || attr.name === '2.16.76.1.3.3'
        )

        if (cnpjAttribute) {
            // O valor pode estar codificado em ASN.1, mas geralmente o forge decodifica para string para esses atributos
            // Se for binário, podemos precisar decodificá-lo. Por enquanto assumindo string/utf8
            cnpj = String(cnpjAttribute.value || '').replace(/\D/g, '')
        }

        // 2. Fallback: Tentar extrair do Nome Comum (formato: Nome:CNPJ ou similar)
        if (!cnpj) {
            const cnpjMatch = holderName.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/)
            if (cnpjMatch) {
                cnpj = cnpjMatch[0].replace(/\D/g, '')
            }
        }

        // --- Lógica de Extração do Nome da Empresa ---
        let companyName = holderName

        // Se encontramos um CNPJ no nome, removê-lo
        if (cnpj) {
            // Remover o CNPJ formatado, se presente
            const formattedCnpj = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
            companyName = companyName.replace(formattedCnpj, '')

            // Remover o CNPJ não formatado, se presente
            companyName = companyName.replace(cnpj, '')
        }

        // Limpar o nome
        companyName = companyName
            .replace(/:$/, '') // Remover dois pontos no final
            .replace(/^[^\w]+/, '') // Remover caracteres não verbais no início
            .replace(/[^\w]+$/, '') // Remover caracteres não verbais no final
            .trim()

        return {
            holderName,
            expirationDate,
            issuer,
            serialNumber,
            subject: {
                commonName: subject.commonName || subject.CN,
                organizationName: subject.organizationName || subject.O,
                countryName: subject.countryName || subject.C,
                ...subject,
            },
            cnpj: cnpj || undefined,
            companyName: companyName || undefined
        }
    } catch (error) {
        if (error instanceof Error) {
            // Tratar erros específicos
            if (error.message.includes('Invalid password')) {
                throw new Error('Senha incorreta para o certificado')
            }
            if (error.message.includes('No certificate found')) {
                throw new Error('Arquivo .pfx inválido ou corrompido')
            }
            throw new Error(`Erro ao processar certificado: ${error.message}`)
        }
        throw new Error('Erro desconhecido ao processar certificado')
    }
}

/**
 * Validar se um buffer é um arquivo .pfx válido
 */
export function isPfxFile(fileBuffer: Buffer): boolean {
    try {
        const binaryString = fileBuffer.toString('binary')
        forge.asn1.fromDer(binaryString)
        return true
    } catch {
        return false
    }
}

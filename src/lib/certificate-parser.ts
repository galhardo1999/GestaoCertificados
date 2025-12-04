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
 * Parse a .pfx (PKCS#12) file and extract certificate metadata
 * @param fileBuffer - The .pfx file as a Buffer
 * @param password - The password to decrypt the .pfx file (optional for some certificates)
 * @returns Certificate metadata including expiration date and holder name
 */
export async function parseCertificate(
    fileBuffer: Buffer,
    password?: string
): Promise<CertificateMetadata> {
    try {
        // Convert Buffer to binary string
        const binaryString = fileBuffer.toString('binary')

        // Parse PKCS#12
        const p12Asn1 = forge.asn1.fromDer(binaryString)
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '')

        // Get the certificate from the PKCS#12
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
        const certBag = certBags[forge.pki.oids.certBag]

        if (!certBag || certBag.length === 0) {
            throw new Error('No certificate found in the .pfx file')
        }

        const certificate = certBag[0].cert
        if (!certificate) {
            throw new Error('Invalid certificate in .pfx file')
        }

        // Extract subject information
        const subject = certificate.subject.attributes.reduce((acc, attr) => {
            const name = attr.name || attr.type
            if (name) {
                acc[name] = String(attr.value || '')
            }
            return acc
        }, {} as Record<string, string>)

        // Extract issuer information
        const issuer = certificate.issuer.attributes
            .map(attr => `${attr.name || attr.type}=${attr.value}`)
            .join(', ')

        // Get the holder name (Common Name or Organization Name)
        const holderName =
            subject.commonName ||
            subject.organizationName ||
            subject.CN ||
            subject.O ||
            'Unknown'

        // Get expiration date
        const expirationDate = certificate.validity.notAfter

        // Get serial number
        const serialNumber = certificate.serialNumber

        // --- CNPJ Extraction Logic ---
        let cnpj = ''

        // 1. Try to find by OID 2.16.76.1.3.3 (ICP-Brasil CNPJ)
        // Note: node-forge might not map this OID to a name, so we check the type/oid
        const cnpjAttribute = certificate.subject.attributes.find(attr =>
            attr.type === '2.16.76.1.3.3' || attr.name === '2.16.76.1.3.3'
        )

        if (cnpjAttribute) {
            // The value might be ASN.1 encoded, but usually forge decodes it to string for these attributes
            // If it's binary, we might need to decode it. For now assuming string/utf8
            cnpj = String(cnpjAttribute.value || '').replace(/\D/g, '')
        }

        // 2. Fallback: Try to extract from Common Name (format: Name:CNPJ or similar)
        if (!cnpj) {
            const cnpjMatch = holderName.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/)
            if (cnpjMatch) {
                cnpj = cnpjMatch[0].replace(/\D/g, '')
            }
        }

        // --- Company Name Extraction Logic ---
        let companyName = holderName

        // If we found a CNPJ in the name, remove it
        if (cnpj) {
            // Remove the formatted CNPJ if present
            const formattedCnpj = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
            companyName = companyName.replace(formattedCnpj, '')

            // Remove unformatted CNPJ if present
            companyName = companyName.replace(cnpj, '')
        }

        // Clean up the name
        companyName = companyName
            .replace(/:$/, '') // Remove trailing colon
            .replace(/^[^\w]+/, '') // Remove leading non-word chars
            .replace(/[^\w]+$/, '') // Remove trailing non-word chars
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
            // Handle specific errors
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
 * Validate if a buffer is a valid .pfx file
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

'use server'

interface CnpjData {
    company: {
        name: string
    }
    address: {
        street: string
        number: string
        district: string
        city: string
        state: string
    }
    error?: string
}

export async function fetchCnpjData(cnpj: string): Promise<{ success: boolean; data?: CnpjData; message?: string }> {
    // Remove non-digits
    const cleanCnpj = cnpj.replace(/\D/g, '')

    if (cleanCnpj.length !== 14) {
        return { success: false, message: 'CNPJ inválido' }
    }

    try {
        // Try Commercial API first if key is present
        const apiKey = process.env.CNPJA_API_KEY
        let url = ''
        let headers: HeadersInit = {}

        if (apiKey) {
            url = `https://api.cnpja.com/office/${cleanCnpj}`
            headers = {
                'Authorization': apiKey
            }
        } else {
            // Fallback to Public API
            url = `https://open.cnpja.com/office/${cleanCnpj}`
        }

        const response = await fetch(url, {
            headers,
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (!response.ok) {
            if (response.status === 429) {
                return { success: false, message: 'Muitas requisições. Tente novamente mais tarde.' }
            }
            return { success: false, message: 'CNPJ não encontrado ou erro na API' }
        }

        const data = await response.json()

        return {
            success: true,
            data: {
                company: {
                    name: data.company?.name || data.alias || data.name
                },
                address: {
                    street: data.address?.street,
                    number: data.address?.number,
                    district: data.address?.district, // Bairro
                    city: data.address?.city,
                    state: data.address?.state
                }
            }
        }

    } catch (error) {
        console.error('Error fetching CNPJ:', error)
        return { success: false, message: 'Erro ao buscar dados do CNPJ' }
    }
}

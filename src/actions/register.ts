'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export interface RegisterResult {
    success: boolean
    message: string
    userId?: string
}

export async function registerUser(
    email: string,
    password: string,
    name: string,
    additionalData?: {
        cnpj?: string
        telefone1?: string
        telefone2?: string
        cep?: string
        endereco?: string
        numero?: string
        bairro?: string
        cidade?: string
        estado?: string
    }
): Promise<RegisterResult> {
    try {
        // Validar entradas
        if (!email || !password || !name) {
            return {
                success: false,
                message: 'Todos os campos são obrigatórios',
            }
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return {
                success: false,
                message: 'Email inválido',
            }
        }

        // Validar tamanho da senha
        if (password.length < 6) {
            return {
                success: false,
                message: 'A senha deve ter pelo menos 6 caracteres',
            }
        }

        // Verificar se usuário já existe
        const existingUser = await prisma.usuario.findUnique({
            where: { email },
        })

        if (existingUser) {
            return {
                success: false,
                message: 'Email já cadastrado',
            }
        }

        // Verificar se CNPJ já existe
        if (additionalData?.cnpj) {
            const existingCnpj = await prisma.usuario.findFirst({
                where: { cnpj: additionalData.cnpj }
            })

            if (existingCnpj) {
                return {
                    success: false,
                    message: 'CNPJ já cadastrado',
                }
            }
        }

        // Criptografar senha
        const hashedPassword = await bcrypt.hash(password, 10)

        // Criar usuário
        const user = await prisma.usuario.create({
            data: {
                email,
                senha: hashedPassword,
                nome: name,
                // Campos adicionais
                cnpj: additionalData?.cnpj,
                telefone1: additionalData?.telefone1,
                telefone2: additionalData?.telefone2,
                cep: additionalData?.cep,
                endereco: additionalData?.endereco,
                numero: additionalData?.numero,
                bairro: additionalData?.bairro,
                cidade: additionalData?.cidade,
                estado: additionalData?.estado,
            },
        })

        return {
            success: true,
            message: 'Conta criada com sucesso!',
            userId: user.id,
        }
    } catch (error) {
        console.error('Error registering user:', error)
        return {
            success: false,
            message: 'Erro ao criar conta. Tente novamente.',
        }
    }
}

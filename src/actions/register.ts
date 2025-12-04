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
    name: string
): Promise<RegisterResult> {
    try {
        // Validate inputs
        if (!email || !password || !name) {
            return {
                success: false,
                message: 'Todos os campos são obrigatórios',
            }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return {
                success: false,
                message: 'Email inválido',
            }
        }

        // Validate password length
        if (password.length < 6) {
            return {
                success: false,
                message: 'A senha deve ter pelo menos 6 caracteres',
            }
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return {
                success: false,
                message: 'Email já cadastrado',
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
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

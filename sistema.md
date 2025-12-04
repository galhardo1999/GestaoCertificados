# Prompt de Desenvolvimento: SaaS de Gestão de Certificados Digitais

## 1. Contexto e Objetivo
Atue como um Arquiteto de Software Sênior e Desenvolvedor Full Stack. Seu objetivo é desenvolver a arquitetura e o código base para um **Micro-SaaS de Gestão de Certificados Digitais (A1)**. O sistema visa resolver o problema de expiração de CNPJs, focando em contadores e empresários.

O foco principal deste MVP é a **automação do ciclo de vida do certificado**, desde a leitura do arquivo `.pfx` até o disparo de alertas de vencimento.

---

## 2. Stack Tecnológica Obrigatória
Você deve utilizar estritamente as seguintes tecnologias:

* **Framework:** Next.js 14+ (App Router, Server Actions).
* **Linguagem:** TypeScript.
* **Banco de Dados:** PostgreSQL.
* **ORM:** Prisma.
* **Storage (Arquivos):** AWS S3.
* **Manipulação de Certificados:** Biblioteca `node-forge` (para extração de metadados do .pfx).
* **Jobs/Cron:** Inngest, Trigger.dev ou Vercel Cron.
* **E-mail Transactional:** Resend.
* **WhatsApp API:** Preparar interface para Evolution API ou Z-API.
* **Estilização:** Tailwind CSS + Shadcn/UI.

---

## 3. Arquitetura e Segurança (Crítico)

### 3.1. Tratamento de Arquivos Sensíveis (.pfx)
* **Upload:** O sistema deve permitir o upload do arquivo A1.
* **Parsing (Diferencial):** Ao fazer o upload, o backend deve usar `node-forge` para ler o binário, extrair a **Data de Vencimento** e o **Nome do Titular** automaticamente. O usuário não deve digitar a data manualmente.
* **Armazenamento:** O arquivo `.pfx` deve ser enviado para um Bucket Privado. O acesso só é permitido via Signed URLs temporárias.

### 3.2. Criptografia de Senhas
* **Regra de Ouro:** Nunca armazenar a senha do certificado em texto plano.
* **Estratégia MVP:** Armazenar o arquivo e a data de validade.
    * *Opção A (Segura):* Criptografar a senha usando AES-256 antes de salvar no banco, usando uma chave mestra via Variável de Ambiente (`ENCRYPTION_KEY`).
    * *Opção B (Isolamento - Preferível para MVP):* Não salvar a senha. O cliente insere a senha apenas quando precisar baixar ou testar o certificado. (Especifique qual opção implementar no código gerado).

---

## 4. Lógica de Negócio: O Ciclo de Renovação (Cron Job)
Implemente um Job diário (execução às 08:00 AM) com a seguinte lógica:

1.  **Query:** Buscar certificados com status `Ativo`.
2.  **Cálculo:** `DiasRestantes = DataVencimento - Hoje`.
3.  **Gatilhos de Notificação:**

| Dias Restantes | Ação / Status | Template da Mensagem (Resumo) |
| :--- | :--- | :--- |
| **45 dias** | Alerta: "Planejamento" | "Seu certificado vence em 45 dias. Vamos agendar para evitar correria?" |
| **15 dias** | Alerta: "Urgência" | "⚠️ Atenção: Faltam 15 dias. Se não renovar, o CNPJ para de emitir notas." |
| **0 dias** | Alerta Crítico + Expiração | Enviar e-mail final ao cliente + Alerta para o admin ligar. |
| **< 0 dias** | Update Status | Alterar status no banco para `Expirado`. |

---

## 5. Escopo do MVP (Deliverables)

### 5.1. Banco de Dados (Schema)
Crie o `schema.prisma` contendo pelo menos:
* `User/Tenant` (Multi-tenancy simples).
* `Certificate` (Campos: file_key, password_encrypted, expiration_date, active, metadata).
* `NotificationLog` (Para evitar envio duplicado de emails no mesmo dia).

### 5.2. Funcionalidades de Frontend
1.  **Dashboard:** Tabela de certificados com "Semáforo" visual:
    * 🟢 Verde (> 30 dias).
    * 🟡 Amarelo (entre 30 e 7 dias).
    * 🔴 Vermelho (< 7 dias).
2.  **Upload Modal:** Dropzone para o `.pfx` + Input de senha (opcional no upload) -> Dispara a leitura dos metadados e mostra a data de validade encontrada para confirmação do usuário.

### 5.3. Backend (API/Actions)
* Rota/Action para processamento do upload (Upload S3 + Parse Node-forge + Save DB).
* Endpoint para o Cron Job (verificar datas e despachar e-mails via Resend).

---

## 6. Instruções de Saída
Por favor, comece fornecendo:
1.  O `schema.prisma` completo.
2.  Um passo a passo da estrutura de pastas do Next.js.
3.  O código do componente de Upload (Frontend) e a Server Action (Backend) responsável pelo parsing do `.pfx` com `node-forge`.
4.  A lógica do Cron Job.
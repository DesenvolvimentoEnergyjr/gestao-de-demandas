# Guia de Implantação White-Label (Para Vendas a outras EJs)

Este documento descreve o fluxo oficial passo a passo para criar uma nova instância do Sistema de Gestão de Demandas para outra EJ.

## 1. Estratégia de Repositório (O Clone Inteligente)

Para garantir que cada EJ tenha seu código isolado mas que ainda possa receber atualizações do núcleo principal:

1. **Clonar o Repositório:** Faça um clone do repositório principal para a sua máquina local:
   ```bash
   git clone https://github.com/DesenvolvimentoEnergyjr/gestao-de-demandas gestao-de-demandas-[nome-da-ej]
   cd gestao-de-demandas-[nome-da-ej]
   ```
2. **Desvincular o Histórico:** Como cada EJ terá suas próprias customizações que podem conflitar entre si com o tempo, limpe o histórico anterior e inicie um novo repositório limpo:
   ```bash
   rm -rf .git
   git init
   git add .
   git commit -m "Commit inicial: Base do sistema Gestão de Demandas"
   ```
3. **Isolamento e Upload:** Adicione um novo repositório vazio **Privado** (previamente criado no GitHub) como sua nova `origin` e suba o código:
   ```bash
   git remote add origin [URL_DO_NOVO_REPOSITORIO_PRIVADO]
   git branch -M main
   git push -u origin main
   ```

## 2. Infraestrutura e Banco de Dados (Firebase)

Os dados dos clientes nunca devem se misturar. Você precisará de um banco exclusivo.

1. Vá ao [Console do Firebase](https://console.firebase.google.com/) e clique em **Adicionar Projeto**.
2. Crie uma aplicação Web (`</>`) dentro do projeto para gerar as chaves do SDK (`NEXT_PUBLIC_FIREBASE_API_KEY`, etc.).
3. **Serviços Essenciais a Ativar no Console:**
   - **Authentication:** Ative os provedores "E-mail/Senha" e "Google".
   - **Firestore Database:** Crie o banco (modo produção) e atualize as regras de segurança (Security Rules).
   - **Storage:** Configure as pastas para anexo de arquivos.
4. **Variáveis de Ambiente:** Copie o arquivo `.env.example`, renomeie para `.env.local` na raiz do projeto e preencha com as novas credenciais.

## 3. Personalização Visual (Branding do Cliente)

A identidade da organização cliente será substituída nestes pontos exatos:

- **Imagens:** Substitua a logo da Navbar e o `favicon.ico` dentro da pasta `/public/`.
- **Cores Principais:** Modifique `primary`, `primary-dark`, `secondary` no `tailwind.config.ts`.
- **Glows e Efeitos:** Atualize os valores de cor diretamente nas propriedades globais do arquivo `src/app/globals.css` (Seção `:root` nas tags `--color-primary`, `--color-secondary` e `--color-secondary-dark`).

_Essas únicas mudanças refletirão por botões, timelines, gráficos de burn-up, modais e e-mails de todo o sistema graças à arquitetura Tailwind + CSS color-mix que adotamos._

## 4. Regras de Negócio e Textos (Tenant Config)

As regras de negócio do cliente ficam centralizadas em um único arquivo: `src/config/tenant.ts`.

Neste arquivo, personalize:

- **Departamentos:** Adapte o organograma do cliente (ex: Vendas, Marketing, RH, Projetos).
- **Tipos de Projeto:** ("Serviços Externos", "Operações", etc).
- **Cargos (Roles):** ("Diretor", "Assessor", "Trainee", etc).
- **Slogans:** Substitua o lema da empresa que aparece nas Sprints e a assinatura (footer) dos e-mails disparados.

Não esqueça de alterar a variável `NEXT_PUBLIC_COMPANY_NAME` no seu `.env.local` para o nome do cliente.

## 5. Integrações Avançadas (Diferenciais)

O sistema automatiza e-mails. Para isso, ative as integrações externas para a organização destino:

**Notificações por E-mail (SMTP):**

- Gere uma senha de app em um Gmail da empresa destino (ex: `sistema@ejcliente.com.br`).
- Insira nas variáveis `SMTP_EMAIL` e `SMTP_PASSWORD`.

## 6. Deploy e Hospedagem (Opções de Venda)

Com o repositório customizado e o banco no ar, é hora de colocar o sistema no ar. Você pode utilizar a [Netlify](https://netlify.com/) (ou a Vercel) para hospedar a aplicação.

Recomendamos oferecer à EJ cliente duas modalidades de entrega no seu contrato:

### Opção A: Entrega Básica (Custo Zero de Infra)

- **Hospedagem:** O deploy é feito de forma gratuita na Netlify ou Vercel.
- **Domínio:** O sistema ganha um link padrão da plataforma, como `https://gestaodemandas-[ej].netlify.app`.
- **Ideal para:** EJs que precisam economizar e não se importam com a marca na URL.

### Opção B: Entrega Profissional (Domínio Próprio)

- **Hospedagem:** O deploy é feito na Netlify/Vercel.
- **Domínio:** A EJ cliente adquire um domínio próprio (ex: através do Registro.br, Hostinger, etc.). O custo de aquisição e renovação anual do domínio (cerca de R$40/ano) **fica sob responsabilidade do cliente**.
- **Ideal para:** EJs que querem transmitir mais credibilidade, utilizando um link como `https://demandas.ejcliente.com.br` ou `https://sistema.ejcliente.com.br`.

**Passo a Passo Padrão do Deploy (Exemplo na Netlify):**

1. Faça login na [Netlify](https://netlify.com/) vinculando a sua conta do GitHub.
2. Clique em "Add new site" -> "Import an existing project" e selecione o repositório privado `gestao-de-demandas-[nome-da-ej]`.
3. Na seção **Environment Variables** (Variáveis de Ambiente), cadastre todas as variáveis do seu `.env.local`.
4. Clique em "Deploy".
5. Se o cliente optou pela **Opção B**, acesse "Domain Management", adicione o domínio customizado da EJ e configure os apontamentos de DNS onde o domínio foi comprado.

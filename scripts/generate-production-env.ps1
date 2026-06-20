# Gera um trecho .env de produção a partir do domínio base.
# Uso: .\scripts\generate-production-env.ps1 -Domain "bordadeiras.com.br"

param(
    [Parameter(Mandatory = $true)]
    [string]$Domain,

    [string]$LojaSubdomain = "loja",
    [string]$StorageSubdomain = "storage",
    [string]$WhatsappSubdomain = "whatsapp"
)

$loja = "https://$LojaSubdomain.$Domain"
$storage = "https://$StorageSubdomain.$Domain"
$whatsappPublic = "https://$WhatsappSubdomain.$Domain"

$secretHint = "<gere_com_openssl_rand_base64_32>"

@"

# Gerado em $(Get-Date -Format "yyyy-MM-dd HH:mm") — revise antes de usar em produção
DOMAIN=$Domain
NODE_ENV=production
NEXT_PUBLIC_APP_URL=$loja
NEXT_PUBLIC_SITE_URL=$loja

NEXT_PUBLIC_SUPABASE_URL=https://supabase.bordadeiras.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

REDIS_URL=redis://redis:6379

S3_ENDPOINT=http://minio:9000
S3_PUBLIC_URL=$storage
S3_REGION=us-east-1
S3_BUCKET=bordadeiras-uploads
S3_ACCESS_KEY=<gere_usuario_minio_producao>
S3_SECRET_KEY=<gere_senha_minio_producao>

WHATSAPP_SERVICE_URL=http://whatsapp-service:4001
WHATSAPP_SERVICE_SECRET=$secretHint

# Mercado Pago: Admin -> Configuracoes (Postgres)
# whatsapp-service: mesma NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + WHATSAPP_SERVICE_SECRET
# Destinatarios WhatsApp: Admin -> WhatsApp
ADMIN_EMAIL=<email_admin_real>
ADMIN_PASSWORD=<gere_senha_forte_12_chars_min>

# Webhook Mercado Pago: $loja/api/webhooks/mercadopago
# WhatsApp público (se expuser): $whatsappPublic — prefira só rede interna

"@ | Write-Output

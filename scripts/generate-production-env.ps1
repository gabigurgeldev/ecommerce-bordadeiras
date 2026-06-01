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

$secretHint = "[gere: openssl rand -base64 32]"

@"

# Gerado em $(Get-Date -Format "yyyy-MM-dd HH:mm") — revise antes de usar em produção
DOMAIN=$Domain
NODE_ENV=production
NEXT_PUBLIC_APP_URL=$loja
NEXT_PUBLIC_SITE_URL=$loja
AUTH_URL=$loja

MYSQL_DATABASE=bordadeiras
MYSQL_USER=bordadeiras
MYSQL_ROOT_PASSWORD=$secretHint
MYSQL_PASSWORD=$secretHint
DATABASE_URL=mysql://bordadeiras:SENHA_AQUI@mysql:3306/bordadeiras

REDIS_URL=redis://redis:6379

S3_ENDPOINT=http://minio:9000
S3_PUBLIC_URL=$storage
S3_REGION=us-east-1
S3_BUCKET=bordadeiras-uploads
S3_ACCESS_KEY=$secretHint
S3_SECRET_KEY=$secretHint

WHATSAPP_SERVICE_URL=http://whatsapp-service:4001
WHATSAPP_SERVICE_SECRET=$secretHint

AUTH_SECRET=$secretHint
# Mercado Pago: Admin -> Configuracoes (MySQL)
# Destinatarios WhatsApp: Admin -> WhatsApp
ADMIN_EMAIL=admin@$Domain
ADMIN_PASSWORD=$secretHint

# Webhook Mercado Pago: $loja/api/webhooks/mercadopago
# WhatsApp público (se expuser): $whatsappPublic — prefira só rede interna

"@ | Write-Output

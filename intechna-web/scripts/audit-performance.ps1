param(
  [string]$BaseUrl = 'http://127.0.0.1:3000',
  [string]$OutputDirectory = 'docs/seo',
  [ValidateSet('home-mobile', 'home-desktop', 'catalog-mobile', 'category-mobile', 'product-mobile', 'article-mobile', 'brand-mobile')]
  [string[]]$Only = @()
)

$ErrorActionPreference = 'Stop'
$auditOrigin = [Uri]$BaseUrl
if ($auditOrigin.Scheme -notin @('http', 'https')) { throw 'BaseUrl must use HTTP(S).' }
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$scenarios = @(
  @{ Name = 'home-mobile'; Route = '/'; Desktop = $false },
  @{ Name = 'home-desktop'; Route = '/'; Desktop = $true },
  @{ Name = 'catalog-mobile'; Route = '/san-pham/catalog'; Desktop = $false },
  @{ Name = 'category-mobile'; Route = '/san-pham/switch'; Desktop = $false },
  @{ Name = 'product-mobile'; Route = '/san-pham/catalog/cisco-cbs110-8t-d'; Desktop = $false },
  @{ Name = 'article-mobile'; Route = '/tin-tuc/checklist-trien-khai-mang-lan-van-phong'; Desktop = $false },
  @{ Name = 'brand-mobile'; Route = '/thuong-hieu/cisco'; Desktop = $false }
)

# Run sequentially so multiple Chrome processes do not compete during measurement.
foreach ($scenario in $scenarios) {
  if ($Only.Count -gt 0 -and $scenario.Name -notin $Only) { continue }
  $reportPrefix = Join-Path $OutputDirectory ('lighthouse-' + $scenario.Name)
  $auditArgs = @(
    'exec', '--offline', '--package=lighthouse', '--', 'lighthouse',
    ($BaseUrl.TrimEnd('/') + $scenario.Route), '--chrome-flags=--headless=new',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=html', '--output=json', ('--output-path=' + $reportPrefix), '--quiet'
  )
  if ($scenario.Desktop) { $auditArgs += '--preset=desktop' }
  & npm.cmd @auditArgs
  if ($LASTEXITCODE -ne 0) { throw ('Lighthouse failed: ' + $scenario.Name) }
  $report = Get-Content -Raw -LiteralPath ($reportPrefix + '.report.json') | ConvertFrom-Json
  [ordered]@{
    scenario = $scenario.Name
    performance = [math]::Round($report.categories.performance.score * 100)
    accessibility = [math]::Round($report.categories.accessibility.score * 100)
    bestPractices = [math]::Round($report.categories.'best-practices'.score * 100)
    seo = [math]::Round($report.categories.seo.score * 100)
    lcp = $report.audits.'largest-contentful-paint'.displayValue
    cls = $report.audits.'cumulative-layout-shift'.displayValue
    tbt = $report.audits.'total-blocking-time'.displayValue
  } | ConvertTo-Json -Compress
}

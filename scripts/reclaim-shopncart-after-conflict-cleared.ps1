# Run AFTER removing shopncart.store / www.shopncart.store from the other AWS account's CloudFront.
# Current account: 164607045775 | Target CloudFront: E1J4QAZXBPV9EQ (d3t30z80wn1i9j.cloudfront.net)

$ErrorActionPreference = 'Stop'
$ZoneId = 'Z098105118S89IQ4N4K6O'
$DistId = 'E1J4QAZXBPV9EQ'
$CertArn = 'arn:aws:acm:us-east-1:164607045775:certificate/00d8bb35-20f8-4492-81a5-75afb88541f7'

Write-Host 'Step 1: associate-alias www...'
python -m awscli cloudfront associate-alias --alias www.shopncart.store --target-distribution-id $DistId --no-verify-ssl

Write-Host 'Step 2: associate-alias apex...'
python -m awscli cloudfront associate-alias --alias shopncart.store --target-distribution-id $DistId --no-verify-ssl

Write-Host 'Step 3: Route53 www CNAME + apex ALIAS...'
$batch = @"
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.shopncart.store.",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{ "Value": "d3t30z80wn1i9j.cloudfront.net" }]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "shopncart.store.",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d3t30z80wn1i9j.cloudfront.net.",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
"@
$path = "$env:TEMP\shopncart-final-dns.json"
Set-Content -Path $path -Value $batch
python -m awscli route53 change-resource-record-sets --hosted-zone-id $ZoneId --change-batch "file://$path" --no-verify-ssl

Write-Host 'Done. Test https://www.shopncart.store and https://shopncart.store'

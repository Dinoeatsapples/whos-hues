$hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"
$entry = "127.0.0.1`twhoscues"
$content = Get-Content $hostsPath -ErrorAction Stop
if ($content -notcontains $entry -and ($content | Select-String -Pattern '^\s*127\.0\.0\.1\s+whoscues\s*$' -Quiet) -ne $true) {
    Add-Content -Path $hostsPath -Value "`n$entry"
    Write-Host "Added hosts entry: $entry"
} else {
    Write-Host "Entry already present."
}

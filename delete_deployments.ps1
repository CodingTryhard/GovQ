$Owner = "CodingTryhard"
$Repo = "GovQ"
$Token = "YOUR_GITHUB_PAT_HERE"
$Headers = @{
    "Authorization" = "Bearer $Token"
    "Accept"        = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$BaseUrl = "https://api.github.com/repos/$Owner/$Repo/deployments"
$Page = 1
$Deployments = @()

Write-Host "Fetching deployments..."
do {
    $Url = "$BaseUrl`?per_page=100&page=$Page"
    try {
        $Response = Invoke-RestMethod -Uri $Url -Headers $Headers -Method Get
        if ($Response) {
            $Deployments += $Response
            $Page++
        }
    } catch {
        Write-Error "Failed to fetch deployments: $_"
        break
    }
} while ($Response.Count -eq 100)

Write-Host "Found $($Deployments.Count) deployments."

$DeletedCount = 0
$SkippedCount = 0

foreach ($Dep in $Deployments) {
    $DepId = $Dep.id
    Write-Host "Processing deployment $DepId..."

    # Step 1: Mark as inactive
    $StatusUrl = "$BaseUrl/$DepId/statuses"
    $Body = @{ state = "inactive" } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri $StatusUrl -Headers $Headers -Method Post -Body $Body -ErrorAction Stop | Out-Null
        Write-Host "  - Marked as inactive."
    } catch {
        Write-Host "  - Failed to mark inactive. Proceeding to delete anyway..."
    }

    # Step 2: Delete
    $DeleteUrl = "$BaseUrl/$DepId"
    try {
        Invoke-RestMethod -Uri $DeleteUrl -Headers $Headers -Method Delete -ErrorAction Stop | Out-Null
        Write-Host "  - Deleted successfully."
        $DeletedCount++
    } catch {
        $ExceptionMessage = $_.Exception.Message
        if ($ExceptionMessage -match "403") {
            Write-Host "  - Skipped (403 Forbidden). Likely owned by an integration." -ForegroundColor Yellow
            $SkippedCount++
        } else {
            Write-Host "  - Failed to delete: $ExceptionMessage" -ForegroundColor Red
            $SkippedCount++
        }
    }
}

Write-Host "`n--- Summary ---"
Write-Host "Total processed: $($Deployments.Count)"
Write-Host "Successfully deleted: $DeletedCount" -ForegroundColor Green
Write-Host "Skipped/Failed: $SkippedCount" -ForegroundColor Yellow

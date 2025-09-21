# Get Edge version
$edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (Test-Path $edgePath) {
    $edgeVersion = (Get-Item $edgePath).VersionInfo.FileVersion
    Write-Host "Edge Version: $edgeVersion"
    
    # Create drivers directory if it doesn't exist
    $driversDir = ".\drivers"
    if (-not (Test-Path $driversDir)) {
        New-Item -ItemType Directory -Path $driversDir
    }
    
    # Download Edge Driver
    $majorVersion = $edgeVersion.Split('.')[0]
    $driverUrl = "https://msedgewebdriverstorage.blob.core.windows.net/edgewebdriver/LATEST_STABLE"
    
    try {
        $downloadUrl = "https://msedgewebdriverstorage.blob.core.windows.net/edgewebdriver/${majorVersion}.0.${majorVersion}40.11/edgedriver_win64.zip"
        $zipPath = Join-Path $driversDir "edgedriver_win64.zip"
        $extractPath = Join-Path $driversDir "edge_${majorVersion}"
        
        Write-Host "Downloading Edge WebDriver..."
        Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
        
        Write-Host "Extracting Edge WebDriver..."
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
        
        Write-Host "Edge WebDriver has been downloaded and extracted to: $extractPath"
        Write-Host "Please update your script to use this path for the Edge WebDriver"
    }
    catch {
        Write-Host "Error downloading Edge WebDriver: $_"
    }
}
else {
    Write-Host "Microsoft Edge is not installed in the expected location"
}


Add-Type -AssemblyName System.Drawing

$assetsDir = "c:\Users\TuPata\Desktop\tasas-backend-main\mobile\assets"
$filesToConvert = @("icon.png", "adaptive-icon.png")

foreach ($file in $filesToConvert) {
    $path = Join-Path $assetsDir $file
    if (Test-Path $path) {
        Write-Host "Converting $file..."
        try {
            # Load the image (it will load as JPEG even with wrong ext)
            $img = [System.Drawing.Bitmap]::FromFile($path)
            
            # Create a temporary path for the new PNG
            $tempPath = $path + ".temp.png"
            
            # Save as PNG
            $img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $img.Dispose()
            
            # Replace original
            Remove-Item $path -Force
            Rename-Item $tempPath $file
            Write-Host "Successfully converted $file to valid PNG."
        }
        catch {
            Write-Error "Failed to convert $file : $_"
        }
    } else {
        Write-Warning "File not found: $path"
    }
}

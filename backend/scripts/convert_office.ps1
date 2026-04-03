param (
    [Parameter(Mandatory=$true)]
    [string]$InputPath,

    [Parameter(Mandatory=$true)]
    [string]$OutputPath
)

$extension = [System.IO.Path]::GetExtension($InputPath).ToLower()

try {
    if ($extension -eq ".docx" -or $extension -eq ".doc") {
        Write-Host "Converting Word document to PDF..."
        $word = New-Object -ComObject Word.Application
        $word.Visible = $false
        $document = $word.Documents.Open($InputPath)
        $document.SaveAs([ref]$OutputPath, [ref]17) # 17 is wdExportFormatPDF
        $document.Close()
        $word.Quit()
        Write-Host "Conversion successful: $OutputPath"
    }
    elseif ($extension -eq ".pptx" -or $extension -eq ".ppt") {
        Write-Host "Converting PowerPoint presentation to PDF..."
        $ppt = New-Object -ComObject PowerPoint.Application
        $presentation = $ppt.Presentations.Open($InputPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
        $presentation.ExportAsFixedFormat($OutputPath, 2) # 2 is ppFixedFormatTypePDF
        $presentation.Close()
        $ppt.Quit()
        Write-Host "Conversion successful: $OutputPath"
    }
    else {
        Write-Error "Unsupported file extension: $extension"
        exit 1
    }
}
catch {
    Write-Error "Conversion failed: $($_.Exception.Message)"
    if ($word) { $word.Quit() }
    if ($ppt) { $ppt.Quit() }
    exit 1
}
finally {
    # Ensure COM objects are released
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

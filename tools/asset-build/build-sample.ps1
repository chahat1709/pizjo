param(
    [Parameter(Mandatory=$true)][string]$InputFile,
    [Parameter(Mandatory=$false)][string]$OutDir = "..\..\assets\dist\hero",
    [Parameter(Mandatory=$false)][string]$OutName = "hero_draco.glb"
)

Set-StrictMode -Version Latest
if (-not (Test-Path $InputFile)) {
    Write-Error "Input file not found: $InputFile"
    exit 2
}

$absOut = Resolve-Path -Path $OutDir -ErrorAction SilentlyContinue
if (-not $absOut) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

Write-Host "Compressing GLTF with gltf-pipeline (Draco)..."
npx gltf-pipeline -i $InputFile -o "$OutDir\$OutName" --draco.compressMeshes true --draco.quantizePosition 14 --draco.quantizeNormal 10 --draco.quantizeTexcoord 12

if ($LASTEXITCODE -ne 0) { Write-Warning "gltf-pipeline may have failed or is unavailable." }

Write-Host "If textures exist, converting to KTX2 via toktx (if installed)..."
if (Get-Command toktx -ErrorAction SilentlyContinue) {
    $texDir = Join-Path -Path (Split-Path $InputFile -Parent) -ChildPath "textures"
    if (Test-Path $texDir) {
        Get-ChildItem -Path $texDir -Include *.png,*.jpg -Recurse | ForEach-Object {
            $in = $_.FullName
            $out = Join-Path -Path $OutDir -ChildPath ($_.BaseName + ".ktx2")
            toktx --target_type=RGBA32 --bcmp --genmipmap --apply_oetf=srgb $out $in
        }
    } else {
        Write-Host "No textures folder found next to the GLB. Skipping texture conversion."
    }
} else {
    Write-Host "toktx not found - skipping KTX2 conversion. Install KTX-Software to enable texture compression."
}

Write-Host "Done. Output in: $OutDir"

param(
    [Parameter(Mandatory=$true)][string]$Input,
    [Parameter(Mandatory=$false)][string]$OutDir = "..\..\assets\dist\hero"
)

Set-StrictMode -Version Latest
if (-not (Test-Path $Input)) {
    Write-Error "Input file not found: $Input"
    exit 2
}

$absOut = Resolve-Path -Path $OutDir -ErrorAction SilentlyContinue
if (-not $absOut) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

Write-Host "Compressing GLTF with gltf-pipeline (Draco)..."
npx gltf-pipeline -i $Input -o "$OutDir\hero_draco.glb" --draco.compressMeshes true --draco.quantizePosition 14 --draco.quantizeNormal 10 --draco.quantizeTexcoord 12

if ($LASTEXITCODE -ne 0) { Write-Warning "gltf-pipeline may have failed or is unavailable." }

Write-Host "If textures exist, converting to KTX2 via toktx (if installed)..."
if (Get-Command toktx -ErrorAction SilentlyContinue) {
    $texDir = Join-Path -Path (Split-Path $Input -Parent) -ChildPath "textures"
    if (Test-Path $texDir) {
        Get-ChildItem -Path $texDir -Include *.png,*.jpg -Recurse | ForEach-Object {
            $in = $_.FullName
            $out = Join-Path -Path $OutDir -ChildPath ($_.BaseName + ".ktx2")
            toktx --target_type=RGBA32 --bcmp --genmipmap --assign_oetf=srgb $out $in
        }
    } else {
        Write-Host "No textures folder found next to the GLTF. Skipping texture conversion."
    }
} else {
    Write-Host "toktx not found — skipping KTX2 conversion. Install KTX-Software to enable texture compression." 
}

Write-Host "Done. Output in: $OutDir"

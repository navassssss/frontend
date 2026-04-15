$f = 'src\pages\StudentsPage.tsx'
$c = Get-Content $f
# Line 323 (0-indexed: 322) = '{status === ...'  -> replace with just the div
# Line 324 (0-indexed: 323) = '    <div ...'     -> keep
# Line 325 (0-indexed: 324) = ')}'               -> remove

$c[322] = $c[323]   # move the div line up, overwriting the conditional
$c[323] = $c[324]   # shift next line
$output = $c[0..323] + $c[325..($c.Length-1)]
Set-Content $f $output
Write-Host "Done. Lines: $($output.Length)"

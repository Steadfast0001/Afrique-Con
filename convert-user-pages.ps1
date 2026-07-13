$files = @('Book.jsx','Ticket.jsx','MyTrips.jsx','Auth.jsx')

foreach($f in $files) {
    $path = "c:\Users\GOLD COMPUTERS\.gemini\antigravity-ide\scratch\TransitFlow\src\pages\$f"
    $c = Get-Content $path -Raw

    # Preserve dark top bars / hero -- we DON'T want to convert bg-stone-950 if it's the page wrapper
    # Focus on inner card classes

    $c = $c -replace 'bg-stone-900 border border-stone-800', 'bg-white border border-gray-200'
    $c = $c -replace 'bg-stone-900 border border-stone-850', 'bg-white border border-gray-200'
    $c = $c -replace 'bg-stone-900 rounded-2xl', 'bg-white rounded-2xl'
    $c = $c -replace 'bg-stone-900 rounded-3xl', 'bg-white rounded-3xl'
    $c = $c -replace 'bg-stone-950/40', 'bg-gray-50'
    $c = $c -replace 'bg-stone-950/60', 'bg-gray-50'
    $c = $c -replace 'bg-stone-950 border border-stone-800', 'bg-gray-50 border border-gray-200'
    $c = $c -replace 'bg-stone-950 border border-stone-850', 'bg-gray-50 border border-gray-200'
    $c = $c -replace 'bg-stone-850', 'bg-gray-100'
    
    $c = $c -replace 'border-stone-850', 'border-gray-200'
    $c = $c -replace 'border-stone-800', 'border-gray-200'
    $c = $c -replace 'border-stone-750', 'border-gray-300'
    $c = $c -replace 'border-stone-700', 'border-gray-300'

    $c = $c -replace 'divide-stone-850/50', 'divide-gray-100'
    $c = $c -replace 'divide-stone-850', 'divide-gray-100'

    $c = $c -replace 'hover:bg-stone-850/30', 'hover:bg-gray-50'
    $c = $c -replace 'hover:bg-stone-850', 'hover:bg-gray-50'
    $c = $c -replace 'hover:bg-stone-800', 'hover:bg-gray-100'
    $c = $c -replace 'hover:text-stone-300', 'hover:text-gray-700'
    $c = $c -replace 'hover:text-white', 'hover:text-gray-900'

    # seats: keep the dark bg-stone-800/900 for seat buttons (they look correct dark)
    # text colors in cards
    $c = $c -replace 'text-stone-550', 'text-gray-400'
    $c = $c -replace 'text-stone-500', 'text-gray-400'
    $c = $c -replace 'text-stone-400', 'text-gray-500'
    $c = $c -replace 'text-stone-300', 'text-gray-600'

    $c = $c -replace 'bg-stone-800 border border-stone-700', 'bg-gray-100 border border-gray-300'
    
    # status badges
    $c = $c -replace 'bg-green-500/10 text-green-400 border border-green-500/20', 'bg-green-50 text-green-700 border border-green-200'
    $c = $c -replace 'bg-amber-500/10 text-amber-400 border border-amber-500/20', 'bg-amber-50 text-amber-700 border border-amber-200'
    $c = $c -replace 'bg-red-500/10 text-red-400 border border-red-500/20', 'bg-red-50 text-red-600 border border-red-200'
    $c = $c -replace 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    $c = $c -replace 'bg-blue-500/10 text-blue-400 border border-blue-500/20', 'bg-blue-50 text-blue-600 border border-blue-200'
    $c = $c -replace 'bg-emerald-500/10', 'bg-emerald-50'
    $c = $c -replace 'text-emerald-400 border border-emerald-500/20', 'text-emerald-700 border border-emerald-200'
    $c = $c -replace 'text-emerald-400', 'text-emerald-600'
    
    $c = $c -replace 'text-amber-400', 'text-amber-600'
    
    # heading text in cards (not full page bg)
    $c = $c -replace 'text-white font-extrabold', 'text-gray-900 font-extrabold'
    $c = $c -replace 'text-white font-bold', 'text-gray-900 font-bold'
    $c = $c -replace 'text-white font-semibold', 'text-gray-700 font-semibold'
    
    # summary sidebar labels
    $c = $c -replace '"text-stone-400 font-medium"', '"text-gray-500 font-medium"'
    $c = $c -replace '"text-white font-bold"', '"text-gray-900 font-bold"'
    $c = $c -replace '"text-white font-semibold"', '"text-gray-700 font-semibold"'

    Set-Content $path $c -NoNewline
    Write-Host "Updated: $f"
}

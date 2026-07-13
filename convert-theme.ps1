$files = @('FleetManager.jsx','RoutesManager.jsx','SchedulesManager.jsx','SupportDesk.jsx','Manifests.jsx','AgentConsole.jsx','Settings.jsx')

foreach($f in $files) {
    $path = "c:\Users\GOLD COMPUTERS\.gemini\antigravity-ide\scratch\TransitFlow\src\pages\admin\$f"
    $c = Get-Content $path -Raw

    # Card backgrounds
    $c = $c -replace 'bg-stone-900 border border-stone-850', 'bg-white border border-gray-200'
    $c = $c -replace 'bg-stone-900 border border-stone-800', 'bg-white border border-gray-200'
    $c = $c -replace 'bg-stone-950 border border-stone-800', 'bg-gray-50 border border-gray-200'
    $c = $c -replace 'bg-stone-950 border border-stone-850', 'bg-gray-50 border border-gray-200'
    
    # Shadows
    $c = $c -replace 'shadow-md', 'shadow-sm'
    
    # Text colors - specific patterns first
    $c = $c -replace 'text-white font-bold', 'text-gray-900 font-bold'
    $c = $c -replace 'text-white font-black', 'text-gray-900 font-black'
    $c = $c -replace 'text-white font-semibold', 'text-gray-900 font-semibold'
    $c = $c -replace 'text-stone-400 text-sm', 'text-gray-400 text-sm'
    $c = $c -replace 'text-stone-400 text-xs', 'text-gray-400 text-xs'
    $c = $c -replace 'text-stone-500 text-xs', 'text-gray-400 text-xs'
    $c = $c -replace 'text-stone-500 text-sm', 'text-gray-400 text-sm'
    $c = $c -replace 'text-stone-300', 'text-gray-600'
    $c = $c -replace 'text-stone-400', 'text-gray-500'
    $c = $c -replace 'text-stone-500', 'text-gray-400'
    $c = $c -replace 'text-stone-550', 'text-gray-400'
    $c = $c -replace 'text-stone-600', 'text-gray-400'
    
    # Borders
    $c = $c -replace 'border-stone-850', 'border-gray-200'
    $c = $c -replace 'border-stone-800', 'border-gray-200'
    
    # Dividers
    $c = $c -replace 'divide-stone-850/50', 'divide-gray-100'
    $c = $c -replace 'divide-stone-850', 'divide-gray-100'
    
    # Hover states
    $c = $c -replace 'hover:bg-stone-850/30', 'hover:bg-gray-50'
    $c = $c -replace 'hover:bg-stone-850', 'hover:bg-gray-50'
    $c = $c -replace 'hover:bg-stone-800/60', 'hover:bg-gray-50'
    $c = $c -replace 'hover:bg-stone-800', 'hover:bg-gray-50'
    
    # Backgrounds  
    $c = $c -replace 'bg-stone-950', 'bg-gray-50'
    $c = $c -replace 'bg-stone-900', 'bg-white'
    
    # Text white to dark
    $c = $c -replace 'text-white', 'text-gray-900'
    
    # Status badges
    $c = $c -replace 'bg-green-500/10 text-green-400 border border-green-500/20', 'bg-green-50 text-green-700 border border-green-200'
    $c = $c -replace 'bg-green-500/10 text-green-400', 'bg-green-50 text-green-700'
    $c = $c -replace 'bg-amber-500/10 text-amber-400 border border-amber-500/20', 'bg-amber-50 text-amber-700 border border-amber-200'
    $c = $c -replace 'bg-amber-500/10 text-amber-400', 'bg-amber-50 text-amber-700'
    $c = $c -replace 'bg-red-500/10 text-red-400 border border-red-500/20', 'bg-red-50 text-red-600 border border-red-200'
    $c = $c -replace 'bg-red-500/10 text-red-400', 'bg-red-50 text-red-600'
    $c = $c -replace 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    $c = $c -replace 'bg-blue-500/10 text-blue-400 border border-blue-500/20', 'bg-blue-50 text-blue-600 border border-blue-200'
    $c = $c -replace 'bg-purple-500/10 text-purple-400 border border-purple-500/20', 'bg-purple-50 text-purple-700 border border-purple-200'
    $c = $c -replace 'bg-purple-500/10 text-purple-400', 'bg-purple-50 text-purple-700'
    
    # Amber text
    $c = $c -replace 'text-amber-400', 'text-amber-600'
    $c = $c -replace 'text-stone-950', 'text-gray-900'
    
    # Hover text
    $c = $c -replace 'hover:text-stone-300', 'hover:text-gray-600'
    $c = $c -replace 'hover:text-stone-250', 'hover:text-gray-600'
    
    Set-Content $path $c -NoNewline
    Write-Host "Updated: $f"
}

@if not defined debug @echo off

:main
    call :getTimestamp
    set start=%timestamp%

    call :compile
    call :fuse

    call :getTimestamp
    call :calc %timestamp% - %start%
    echo 编译耗时 %calcResult% ms
    pause
exit /b 0

:compile
    echo 正在清空 dist...
    rd /s /q "%cd%\dist"

    echo 编译 TypeScript...
    for /r "%cd%" %%f in (*.ts) do (
        call tsc "%%~f" --outDir "%cd%\dist" -t esnext -m esnext --lib esnext --lib dom --moduleResolution node --declaration --strict true --skipLibCheck
    )
exit /b 0

:: 需要手动维护需要融合的脚本。
:fuse
    >full_random.js break

    set files=data-cast random-support uuid random test

    for %%f in (%files%) do >> full_random.js (
        echo // === %%f ===
        findstr /V /R /C:"^import " /C:"^export " "%cd%\dist\%%f.js"
        echo=
    )

    for %%f in (%files%) do >> full_random.d.ts (
        echo // === %%f ===
        findstr /V /R /C:"^import " /C:"^export " "%cd%\dist\%%f.d.ts"
        echo=
    )

    echo 融合完成: full_random.js
exit /b 0

:calc
    for /f %%i in ('powershell -command "[double](%*)"') do set calcResult=%%i
exit /b 0

:getTimestamp
    for /f %%i in ('powershell -command "[int64](([DateTime]::UtcNow.Ticks-621355968000000000)/10000)"') do set timestamp=%%i
exit /b 0

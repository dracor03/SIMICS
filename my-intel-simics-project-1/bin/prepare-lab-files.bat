@echo off
rem this file will be overwritten by the project setup script
setlocal
set SIMICS_BASE_PACKAGE=C:\Users\C28330\AppData\Local\Programs\Simics\simics-7.113.0
if "%SIMICS_PYTHON_PACKAGE%"=="" (
    set SIMICS_PYTHON_PACKAGE=
)
set "SIMICS_PYTHON=%~dp0..\python.bat"
"C:\Users\C28330\AppData\Local\Programs\Simics\simics-7.113.0\..\simics-training-7.0.0-pre.13\bin\prepare-lab-files.bat"  %*

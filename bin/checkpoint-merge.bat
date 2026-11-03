
@echo off
rem this file will be overwritten by the project setup script
setlocal
set SIMICS_BASE_PACKAGE=C:\Users\C28330\AppData\Local\Programs\Simics\simics-7.113.0
if "%SIMICS_PYTHON_PACKAGE%"=="" (
    set SIMICS_PYTHON_PACKAGE=
)
set "SIMICS_PYTHON=%~dp0..\python.bat"
if exist "C:\Users\C28330\simics-projects\my-intel-simics-project-1\.package-list" set SIMICS_EPL=--package-list "C:\Users\C28330\simics-projects\my-intel-simics-project-1\.package-list"
if not exist "C:\Users\C28330\simics-projects\my-intel-simics-project-1\.package-list" set SIMICS_EPL=
"C:\Users\C28330\AppData\Local\Programs\Simics\simics-7.113.0\bin\checkpoint-merge.bat" %SIMICS_EPL% --project "C:\Users\C28330\simics-projects\my-intel-simics-project-1" %*

# Quick Deployment Script for Vercel (PowerShell)
# This script helps you deploy with proper checks

Write-Host "🚀 Dhampus Eco Lodge - Deployment Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is clean
$gitStatus = git status -s
if ($gitStatus) {
    Write-Host "📝 You have uncommitted changes." -ForegroundColor Yellow
    Write-Host "Files changed:"
    git status -s
    Write-Host ""
    $commit = Read-Host "Do you want to commit these changes? (y/n)"
    if ($commit -eq "y" -or $commit -eq "Y") {
        git add .
        $commitMsg = Read-Host "Enter commit message"
        git commit -m $commitMsg
    }
} else {
    Write-Host "✅ Git repository is clean" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔍 Running pre-deployment checks..." -ForegroundColor Cyan
Write-Host ""

# Check if package.json has required scripts
$packageJson = Get-Content "package.json" -Raw
if ($packageJson -match "prisma generate") {
    Write-Host "✅ Prisma generate script found in package.json" -ForegroundColor Green
} else {
    Write-Host "❌ Missing prisma generate in package.json" -ForegroundColor Red
    exit 1
}

# Check if .env.example exists
if (Test-Path ".env.example") {
    Write-Host "✅ .env.example file exists" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Required environment variables:" -ForegroundColor Yellow
    Get-Content ".env.example"
} else {
    Write-Host "⚠️  Warning: .env.example not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Ready to deploy to Vercel!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Options:"
Write-Host "  1. Push to GitHub (auto-deploy if connected)"
Write-Host "  2. Deploy using Vercel CLI"
Write-Host "  3. Exit"
Write-Host ""
$option = Read-Host "Choose option (1-3)"

switch ($option) {
    "1" {
        Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
        git push
        Write-Host ""
        Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
        Write-Host "If you have auto-deploy enabled, Vercel will deploy automatically."
        Write-Host "Check: https://vercel.com/dashboard"
    }
    "2" {
        if (Get-Command "vercel" -ErrorAction SilentlyContinue) {
            Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
            vercel --prod
        } else {
            Write-Host "❌ Vercel CLI not installed" -ForegroundColor Red
            Write-Host "Install with: npm i -g vercel"
        }
    }
    "3" {
        Write-Host "👋 Deployment cancelled" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "❌ Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green

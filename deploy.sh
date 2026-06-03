#!/bin/bash

# Quick Deployment Script for Vercel
# This script helps you deploy with proper checks

echo "🚀 Dhampus Eco Lodge - Deployment Helper"
echo "========================================"
echo ""

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "📝 You have uncommitted changes."
    echo "Files changed:"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    fi
else
    echo "✅ Git repository is clean"
fi

echo ""
echo "🔍 Running pre-deployment checks..."
echo ""

# Check if package.json has required scripts
if grep -q "prisma generate" package.json; then
    echo "✅ Prisma generate script found in package.json"
else
    echo "❌ Missing prisma generate in package.json"
    exit 1
fi

# Check if .env.example exists
if [ -f ".env.example" ]; then
    echo "✅ .env.example file exists"
    echo ""
    echo "📋 Required environment variables:"
    cat .env.example
else
    echo "⚠️  Warning: .env.example not found"
fi

echo ""
echo "🌐 Ready to deploy to Vercel!"
echo ""
echo "Options:"
echo "  1. Push to GitHub (auto-deploy if connected)"
echo "  2. Deploy using Vercel CLI"
echo "  3. Exit"
echo ""
read -p "Choose option (1-3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "📤 Pushing to GitHub..."
        git push
        echo ""
        echo "✅ Pushed to GitHub!"
        echo "If you have auto-deploy enabled, Vercel will deploy automatically."
        echo "Check: https://vercel.com/dashboard"
        ;;
    2)
        if command -v vercel &> /dev/null; then
            echo "🚀 Deploying to Vercel..."
            vercel --prod
        else
            echo "❌ Vercel CLI not installed"
            echo "Install with: npm i -g vercel"
        fi
        ;;
    3)
        echo "👋 Deployment cancelled"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✨ Done!"

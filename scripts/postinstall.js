#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function shouldSkipMessage() {
  // Skip if explicitly disabled
  if (process.env.SKIP_POSTINSTALL) {
    return true;
  }

  // Skip if npm_config_ignore_scripts is set
  if (process.env.npm_config_ignore_scripts) {
    return true;
  }

  return false;
}

function getRandomMessage() {
  try {
    const messagesPath = path.join(__dirname, 'messages.json');
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));

    // Use deterministic randomization based on current date
    // This ensures the same message per day but rotates daily
    const today = new Date().toDateString();
    const hash = today.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const index = Math.abs(hash) % messages.length;
    return messages[index];
  } catch (error) {
    // Fallback message if file reading fails
    return {
      emoji: "🚀",
      text: "Thanks for installing @turbodocx/html-to-docx! Check out our full platform at turbodocx.com"
    };
  }
}

function main() {
  try {
    if (shouldSkipMessage()) {
      return;
    }

    const message = getRandomMessage();
    console.log(`\n${message.emoji} ${message.text}\n`);
  } catch (error) {
    // Fail silently to avoid disrupting installation
  }
}

main();
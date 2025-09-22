#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');
const EXCLUDED_USERS = ['dependabot[bot]', 'dependabot', 'github-actions[bot]'];

async function getGitHubUserEmail(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'contributor-bot'
      }
    });

    if (response.ok) {
      const user = await response.json();
      return user.email;
    }
  } catch (error) {
    console.log(`Could not fetch email for ${username}:`, error.message);
  }
  return null;
}

function formatContributor(username, email) {
  if (email && email !== 'null' && email !== '') {
    return `${username} <${email}>`;
  }
  return username;
}

function isContributorAlreadyListed(contributors, username) {
  const normalizedUsername = username.toLowerCase();
  return contributors.some(contributor => {
    const contributorName = contributor.split(' ')[0].toLowerCase();
    return contributorName === normalizedUsername;
  });
}

async function updateContributors() {
  const prAuthor = process.env.PR_AUTHOR;

  if (!prAuthor) {
    console.log('No PR author found in environment variables');
    return;
  }

  // Check if user should be excluded
  if (EXCLUDED_USERS.includes(prAuthor)) {
    console.log(`Skipping excluded user: ${prAuthor}`);
    return;
  }

  console.log(`Processing contributor: ${prAuthor}`);

  // Read package.json
  let packageJson;
  try {
    const packageContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
    packageJson = JSON.parse(packageContent);
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
  }

  // Initialize contributors array if it doesn't exist
  if (!packageJson.contributors) {
    packageJson.contributors = [];
  }

  // Check if contributor is already listed
  if (isContributorAlreadyListed(packageJson.contributors, prAuthor)) {
    console.log(`Contributor ${prAuthor} is already listed`);
    return;
  }

  // Try to get user email
  const email = await getGitHubUserEmail(prAuthor);
  const formattedContributor = formatContributor(prAuthor, email);

  // Add new contributor
  packageJson.contributors.push(formattedContributor);

  // Sort contributors alphabetically (case-insensitive)
  packageJson.contributors.sort((a, b) => {
    const nameA = a.split(' ')[0].toLowerCase();
    const nameB = b.split(' ')[0].toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Write updated package.json
  try {
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Added ${formattedContributor} to contributors list`);
  } catch (error) {
    console.error('Error writing package.json:', error.message);
    process.exit(1);
  }
}

// Run the script
updateContributors().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});
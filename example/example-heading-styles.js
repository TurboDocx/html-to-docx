/* eslint-disable no-console */
const fs = require('fs');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

/**
 * This example demonstrates the customizable heading styles feature
 * introduced in PR #129: https://github.com/TurboDocx/html-to-docx/pull/129
 */

const filePath = './example-heading-styles.docx';

const htmlString = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Customizable Heading Styles Example</title>
    </head>
    <body>
        <h1>Main Title - Custom H1 Style</h1>
        <p>This heading uses a custom Arial font at 72pt (36pt in half-points) with extra spacing.</p>

        <h2>Section Header - Custom H2 Style</h2>
        <p>This heading uses Georgia font at 40pt with custom spacing before and after.</p>

        <h3>Subsection - Custom H3 Style</h3>
        <p>This heading uses a smaller font size and is not bold (unlike default).</p>

        <h4>Detail Section - Default H4 Style</h4>
        <p>This heading uses the default styling to show the difference.</p>

        <h5>Fine Print Header - Custom H5 Style</h5>
        <p>This heading has minimal spacing and a specific outline level.</p>

        <h6>Smallest Header - Default H6 Style</h6>
        <p>This heading also uses default styling.</p>

        <h1>Second Main Title</h1>
        <p>All H1 tags will use the same custom style defined in the configuration.</p>

        <h2>Another Section</h2>
        <p>All H2 tags will use the same custom style.</p>

        <h3>More Subsections</h3>
        <p>Demonstrating consistent styling across multiple headings of the same level.</p>
    </body>
</html>`;

(async () => {
  console.log('🎨 Creating DOCX with customizable heading styles...\n');

  // Define custom heading styles
  const customHeadingOptions = {
    heading1: {
      font: 'Arial',
      fontSize: 72, // 36pt in Word (OOXML uses half-points: 72 / 2 = 36pt)
      bold: true,
      spacing: {
        before: 600, // Spacing in twips (1/20 of a point)
        after: 200,
      },
      keepLines: true,
      keepNext: true,
      outlineLevel: 0,
    },
    heading2: {
      font: 'Georgia',
      fontSize: 40, // 20pt in Word (40 / 2 = 20pt)
      bold: true,
      spacing: {
        before: 400,
        after: 150,
      },
      keepLines: true,
      keepNext: true,
      outlineLevel: 1,
    },
    heading3: {
      font: 'Calibri',
      fontSize: 26, // 13pt in Word (26 / 2 = 13pt)
      bold: false, // Not bold (different from default)
      spacing: {
        before: 240,
        after: 100,
      },
      keepLines: true,
      keepNext: true,
      outlineLevel: 2,
    },
    // heading4, heading5, heading6 will use default styles
    heading5: {
      font: 'Times New Roman',
      fontSize: 20, // 10pt in Word (20 / 2 = 10pt)
      bold: true,
      spacing: {
        before: 120,
        after: 60,
      },
      keepLines: false, // Allow splits
      keepNext: false,
      outlineLevel: 4,
    },
  };

  console.log('📋 Custom Heading Configuration:');
  console.log('  H1: Arial, 36pt, bold, extra spacing');
  console.log('  H2: Georgia, 20pt, bold, custom spacing');
  console.log('  H3: Calibri, 13pt, NOT bold, custom spacing');
  console.log('  H4: (using defaults)');
  console.log('  H5: Times New Roman, 10pt, bold, minimal spacing');
  console.log('  H6: (using defaults)\n');

  try {
    const fileBuffer = await HTMLtoDOCX(htmlString, null, {
      heading: customHeadingOptions,
      title: 'Customizable Heading Styles Demo',
      subject: 'Demonstrating PR #129 - Customizable Heading Styles',
      creator: 'TurboDocx Example',
      description: 'This document showcases the customizable heading styles feature',
    });

    fs.writeFile(filePath, fileBuffer, (error) => {
      if (error) {
        console.log('❌ Docx file creation failed');
        console.error(error);
        return;
      }
      console.log('✅ Docx file created successfully: ' + filePath);
      console.log('\n📖 Open the file to see:');
      console.log('   • Custom fonts for different heading levels');
      console.log('   • Custom font sizes');
      console.log('   • Custom spacing before/after headings');
      console.log('   • H3 without bold (customized)');
      console.log('   • H4 and H6 with default styles (for comparison)');
    });
  } catch (error) {
    console.log('❌ Error generating document');
    console.error(error);
  }
})();

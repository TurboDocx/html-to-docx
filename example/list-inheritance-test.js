const HTMLtoDOCX = require('../dist/html-to-docx.umd.js');
const fs = require('fs');

// Test HTML with extreme list style inheritance conflicts
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Extreme List Inheritance Stress Test</title>
</head>
<body>
    <!-- BASIC INHERITANCE TESTS -->
    <h2>Basic List Style Inheritance</h2>
    
    <ul style="color: red; font-size: 16px;">
        <li style="color: blue;">Should be BLUE (child overrides parent)</li>
        <li>Should be RED (inherits from parent)</li>
        <li style="font-size: 20px;">Should be RED but LARGER</li>
    </ul>

    <ul style="color: red; font-family: Arial;">
        <li>Level 1 - Red Arial
            <ol style="color: green; font-size: 18px;">
                <li>Level 2 - Green Arial 18px
                    <ul style="color: blue; font-family: Times;">
                        <li>Level 3 - Blue Times 18px</li>
                        <li style="color: purple;">Level 3 - Purple Times 18px</li>
                    </ul>
                </li>
            </ol>
        </li>
    </ul>

    <!-- FONT WEIGHT/STYLE INHERITANCE BUGS -->
    <h2>Font Weight/Style Inheritance (Critical Bug Cases)</h2>
    
    <div style="font-weight: bold;">
        <ul>
            <li>Should be bold (inherits from div)</li>
            <li style="font-weight: normal;">Should NOT be bold (explicitly normal)</li>
            <li>Should be bold again (inherits from div)</li>
        </ul>
    </div>

    <div style="font-style: italic;">
        <ol>
            <li>Should be italic (inherits from div)</li>
            <li style="font-style: normal;">Should NOT be italic (explicitly normal)</li>
            <li>Should be italic again (inherits from div)</li>
        </ol>
    </div>

    <div style="font-weight: bold; font-style: italic;">
        <ul>
            <li>Should be bold and italic</li>
            <li style="font-weight: normal;">Should be italic only (normal weight)</li>
            <li style="font-style: normal;">Should be bold only (normal style)</li>
            <li style="font-weight: normal; font-style: normal;">Should be completely normal</li>
        </ul>
    </div>

    <!-- EXTREME INHERITANCE CONFLICTS (ULTIMATE STRESS TEST) -->
    <h2>EXTREME Inheritance Conflicts (ULTIMATE STRESS TEST)</h2>
    
    <!-- 6-Level Deep Alternating Conflicts -->
    <div style="font-weight: bold; font-style: italic; color: red; font-size: 20px; text-decoration: underline;">
        <p>Level 1: Bold Italic Red 20px Underlined</p>
        <div style="font-weight: normal; color: blue; font-size: 16px;">
            <p>Level 2: Normal Italic Blue 16px Underlined</p>
            <div style="font-style: normal; color: green; text-decoration: none;">
                <p>Level 3: Normal Normal Green 16px No-underline</p>
                <div style="font-weight: bold; font-style: italic; color: purple; font-size: 24px; text-decoration: line-through;">
                    <p>Level 4: Bold Italic Purple 24px Strikethrough</p>
                    <div style="font-weight: normal; font-style: normal; color: orange; font-size: 12px; text-decoration: underline;">
                        <p>Level 5: Normal Normal Orange 12px Underlined</p>
                        <ul style="font-weight: bold; font-style: italic; color: black; font-size: 18px; text-decoration: none;">
                            <li>Level 6 List: Should be Bold Italic Black 18px No-decoration</li>
                            <li style="font-weight: normal;">L6: Normal Italic Black 18px</li>
                            <li style="font-style: normal;">L6: Bold Normal Black 18px</li>
                            <li style="color: red;">L6: Bold Italic Red 18px</li>
                            <li style="font-size: 30px;">L6: Bold Italic Black 30px</li>
                            <li style="text-decoration: underline;">L6: Bold Italic Black 18px Underlined</li>
                            <li style="font-weight: normal; font-style: normal; color: yellow; font-size: 14px; text-decoration: line-through;">
                                L6: Normal Normal Yellow 14px Strikethrough (ALL OVERRIDDEN)
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Conflicting Inheritance with Multiple Container Types -->
    <div style="font-weight: bold; font-style: italic;">
        <h4>Container Type Conflicts</h4>
        <p style="font-weight: normal;">Paragraph: Normal Italic</p>
        <span style="font-style: normal;">
            <strong style="font-weight: normal;">Strong tag with normal weight: Normal Normal</strong>
            <em style="font-style: normal;">Em tag with normal style: Bold Normal (conflicted)</em>
            <table style="font-weight: normal; font-style: normal;">
                <tr>
                    <td style="font-weight: bold;">
                        <ul style="font-style: italic;">
                            <li>Table cell list: Bold Italic (re-enabled both)</li>
                            <li style="font-weight: normal; font-style: normal;">
                                Cell list item: Normal Normal
                                <ol style="font-weight: bold;">
                                    <li style="font-style: italic;">Nested in cell: Bold Italic (deep conflict)</li>
                                </ol>
                            </li>
                        </ul>
                    </td>
                </tr>
            </table>
        </span>
    </div>

    <!-- Circular Inheritance Nightmare -->
    <div style="font-weight: bold; color: red;">
        <div style="font-weight: normal; font-style: italic; color: blue;">
            <div style="font-weight: bold; font-style: normal; color: green;">
                <div style="font-weight: normal; font-style: italic; color: red;">
                    <div style="font-weight: bold; font-style: normal; color: blue;">
                        <ul>
                            <li>Circular inheritance: Bold Normal Blue</li>
                            <li style="font-weight: normal; font-style: italic; color: green;">
                                Override circular: Normal Italic Green
                                <ol style="font-weight: bold; font-style: normal; color: red;">
                                    <li>Nested circular override: Bold Normal Red</li>
                                    <li style="font-weight: normal; font-style: italic; color: blue;">
                                        Deep circular: Normal Italic Blue
                                        <ul style="font-weight: bold; font-style: normal; color: green;">
                                            <li>Deepest circular: Bold Normal Green</li>
                                        </ul>
                                    </li>
                                </ol>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Multiple Property Conflicts with Edge Cases -->
    <div style="font-weight: bold; font-style: italic; color: red; font-size: 20px; text-decoration: underline; background-color: lightgray;">
        <h4>Multiple Property Conflicts</h4>
        <ul style="font-weight: normal; color: blue; font-size: 16px; text-decoration: none; background-color: lightyellow;">
            <li>Override parent: Normal Italic Blue 16px No-decoration Yellow-bg</li>
            <li style="font-weight: bold; font-style: normal; color: green; font-size: 24px; text-decoration: line-through; background-color: lightpink;">
                Override everything: Bold Normal Green 24px Strikethrough Pink-bg
                <ol style="font-weight: normal; font-style: italic; color: purple; font-size: 12px; text-decoration: underline; background-color: lightblue;">
                    <li>Nested override: Normal Italic Purple 12px Underlined Blue-bg</li>
                    <li style="font-weight: bold; font-style: normal; color: orange; font-size: 28px; text-decoration: none; background-color: lightgreen;">
                        Double nested: Bold Normal Orange 28px No-decoration Green-bg
                        <ul style="font-weight: normal; font-style: italic; color: black; font-size: 14px; text-decoration: line-through; background-color: white;">
                            <li>Triple nested: Normal Italic Black 14px Strikethrough White-bg</li>
                        </ul>
                    </li>
                </ol>
            </li>
        </ul>
    </div>

    <!-- Inheritance Chain Breaking -->
    <div style="font-weight: bold;">
        <div style="font-style: italic;">
            <div style="color: red;">
                <div style="font-size: 20px;">
                    <div style="text-decoration: underline;">
                        <p>Chain: Bold Italic Red 20px Underlined</p>
                        <!-- BREAK THE CHAIN -->
                        <div style="font-weight: normal; font-style: normal; color: blue; font-size: 12px; text-decoration: none;">
                            <p>CHAIN BROKEN: Normal Normal Blue 12px No-decoration</p>
                            <!-- REBUILD DIFFERENT CHAIN -->
                            <div style="font-weight: bold;">
                                <div style="font-style: italic;">
                                    <div style="color: green;">
                                        <div style="font-size: 24px;">
                                            <div style="text-decoration: line-through;">
                                                <ul>
                                                    <li>NEW CHAIN: Bold Italic Green 24px Strikethrough</li>
                                                    <li style="font-weight: normal;">Chain variant 1: Normal Italic Green 24px Strikethrough</li>
                                                    <li style="font-style: normal;">Chain variant 2: Bold Normal Green 24px Strikethrough</li>
                                                    <li style="color: purple;">Chain variant 3: Bold Italic Purple 24px Strikethrough</li>
                                                    <li style="font-size: 16px;">Chain variant 4: Bold Italic Green 16px Strikethrough</li>
                                                    <li style="text-decoration: underline;">Chain variant 5: Bold Italic Green 24px Underlined</li>
                                                    <li style="font-weight: normal; font-style: normal; color: yellow; font-size: 10px; text-decoration: none;">
                                                        BREAK NEW CHAIN: Normal Normal Yellow 10px No-decoration
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- The ULTIMATE CHAOS (Every possible conflict) -->
    <div style="font-weight: bold; font-style: italic; color: red; font-size: 20px; text-decoration: underline; background-color: lightgray; text-align: center;">
        <h4>ULTIMATE CHAOS TEST</h4>
        <table style="font-weight: normal; font-style: normal; color: blue; font-size: 16px; text-decoration: none; background-color: lightyellow; text-align: left;">
            <tr>
                <td style="font-weight: bold; color: green; font-size: 18px; text-decoration: line-through;">
                    <p style="font-style: italic; color: purple; font-size: 22px; background-color: lightpink;">
                        <span style="font-weight: normal; font-style: normal; color: orange; font-size: 14px; text-decoration: underline; background-color: lightblue;">
                            <strong style="font-weight: bold; color: black;">
                                <em style="font-style: italic; font-size: 26px;">
                                    <u style="text-decoration: none; color: brown;">
                                        <div style="font-weight: normal; font-style: normal; color: cyan; font-size: 12px; text-decoration: line-through; background-color: lightgreen; text-align: right;">
                                            <ul style="font-weight: bold; font-style: italic; color: magenta; font-size: 30px; text-decoration: underline; background-color: white; text-align: center;">
                                                <li>CHAOS LEVEL 1: Bold Italic Magenta 30px Underlined White-bg Center</li>
                                                <li style="font-weight: normal; font-style: normal; color: yellow; font-size: 8px; text-decoration: none; background-color: black; text-align: left;">
                                                    CHAOS LEVEL 2: Normal Normal Yellow 8px No-decoration Black-bg Left (MAXIMUM OVERRIDE)
                                                </li>
                                            </ul>
                                        </div>
                                    </u>
                                </em>
                            </strong>
                        </span>
                    </p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
`;

async function runListInheritanceTest() {
  console.log('🧪 Running EXTREME List Style Inheritance Test...');
  console.log('='.repeat(60));

  try {
    const docxBuffer = await HTMLtoDOCX(testHTML, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    const outputPath = './list-inheritance-test-output.docx';
    fs.writeFileSync(outputPath, docxBuffer);

    console.log('✅ SUCCESS: DOCX file generated successfully!');
    console.log(`📄 Output saved to: ${outputPath}`);
    console.log('');
    console.log('🔍 EXTREME TEST CASES INCLUDED:');
    console.log('   🎯 Basic inheritance conflicts');
    console.log('   🚨 Font-weight/style inheritance bugs');
    console.log('   💥 6-level deep alternating conflicts');
    console.log('   🔄 Circular inheritance nightmares');
    console.log('   ⚡ Multiple property conflicts');
    console.log('   🔗 Inheritance chain breaking/rebuilding');
    console.log('   🌪️  ULTIMATE CHAOS with maximum conflicts');
    console.log('');
    console.log('🚨 CRITICAL VERIFICATION POINTS:');
    console.log('   • font-weight: normal should NOT be bold');
    console.log('   • font-style: normal should NOT be italic');
    console.log('   • Child styles must override parent styles');
    console.log('   • Deep nesting inheritance must work correctly');
    console.log('   • Multiple container types must handle inheritance');
    console.log('   • Circular conflicts must resolve properly');
  } catch (error) {
    console.error('❌ ERROR: Test failed!');
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

runListInheritanceTest();
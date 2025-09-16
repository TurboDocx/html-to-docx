/* eslint-disable no-console */
const fs = require('fs');
// FIXME: Incase you have the npm package
// const HTMLtoDOCX = require('html-to-docx');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

const filePath = '../example.docx';
const listStylesFilePath = '../list-styles-test.docx';

const htmlString = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Document</title>
    </head>
    <body>
        <div>
            <p>Taken from wikipedia</p>
            <img
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Red dot"
            />
            <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png"
                alt="Red dot"
            />
            <!-- Image edge case tests covering all scenarios addressed by the PR -->
            <p>Testing images with non-dimensional CSS styles (font-family, color):</p>
            <img
                style="font-family: Poppins, Arial, sans-serif;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Test image with font-family style"
            />
            <img
                style="color: red; font-family: monospace;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Test image with color and font-family styles"
            />
            
            <p>Testing images with mixed dimensional and non-dimensional styles:</p>
            <img
                style="width: 100px; font-family: Arial; color: blue;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Test image with mixed styles"
            />
            
            <p>Testing images with various non-dimensional styles:</p>
            <img
                style="text-align: center; background-color: yellow;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Test image with text-align and background-color"
            />
            <img
                style="border: 2px solid red; margin: 10px;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Test image with border and margin"
            />
        </div>
        <div>
            <h1>This is heading 1</h1>
            <p>Content</p>
            <h2>This is heading 2</h2>
            <p>Content</p>
            <h3>This is heading 3</h3>
            <p>Content</p>
            <h4>This is heading 4</h4>
            <p>Content</p>
            <h5>This is heading 5</h5>
            <p>Content</p>
            <h6>This is heading 6</h6>
            <p>Content</p>
        </div>
        <p>
            <strong>
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make
                a type specimen book.
            </strong>
            <i>It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.</i>
            <u>It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages,</u>and more recently with desktop publishing software
            <span style="color: hsl(0, 75%, 60%);"> like Aldus PageMaker </span>including versions of Lorem Ipsum.
            <span style="background-color: hsl(0, 75%, 60%);">Where does it come from? Contrary to popular belief, Lorem Ipsum is not simply random text.</span>
            It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.
        </p>
        <p style="font-family: 'Courier New', Courier, monospace;">Look at me, i'm a paragraph in Courier New!</p>
        <p style="font-family: SerifTestFont, serif;">Look at me, i'm a paragraph in SerifTestFont!</p>
        <p style="font-family: SansTestFont, sans-serif;">Look at me, i'm a paragraph in SansTestFont!</p>
        <p style="font-family: MonoTestFont, monospace;">Look at me, i'm a paragraph in MonoTestFont!</p>
        <blockquote>
            For 50 years, WWF has been protecting the future of nature. The world's leading conservation organization, WWF works in 100 countries and is supported by 1.2 million members in the United States and close to 5 million globally.
        </blockquote>
        <p>
            <strong>
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make
                a type specimen book.
            </strong>
        </p>
        <p style="margin-left: 40px;">
            <strong>Left indented paragraph:</strong>
            <span>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</span>
        </p>
        <p style="margin-right: 40px;">
            <strong>Right indented paragraph:</strong>
            <span>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</span>
        </p>
        <p style="margin-left: 40px; margin-right: 40px;">
            <strong>Left and right indented paragraph:</strong>
            <span>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</span>
        </p>
        <ul style="list-style-type: circle;">
            <li>Unordered list element</li>
        </ul>
        <br>
        <ol style="list-style-type: decimal;">
            <li>Ordered list element</li>
        </ol>
        <div class="page-break" style="page-break-after: always"></div>
        <ul>
            <li><span style="font-size:10pt"><span style="color:##e28743">I am a teacup <strong><span style="color:#595959">A strong teacup</span></strong></span></span></li>
            <li><span style="font-size:10pt"><span style="color:#4d4f53">I am another teacup <strong><span style="color:#2596be">A blue</span></strong> Teacup</span></span></li>
            <li><span style="font-size:10pt"><span style="color:#cc1177">Stonks only go up if you turn the chart sometimes</span></span></li>
        </ul>
        <div class="page-break" style="page-break-after: always"></div>
        <ul>
            <li>
                <a href="https://en.wikipedia.org/wiki/Coffee">
                    <strong>
                        <u>Coffee</u>
                    </strong>
                </a>
            </li>
            <li>
                <span>
                    Black
                    <a href="https://en.wikipedia.org/wiki/Coffee">
                        Strong
                        <strong>
                            <u>Coffee</u>
                        </strong>
                    </a>
                </span>
            </li>
            <li>Tea
                <ol>
                    <li>Black tea
                        <ol style="list-style-type:lower-alpha-bracket-end;" data-start="2">
                            <li>Srilankan <strong>Tea</strong>
                                <ul>
                                    <li>Uva <b>Tea</b></li>
                                </ul>
                            </li>
                            <li>Assam Tea</li>
                        </ol>
                    </li>
                    <li>Green tea</li>
                </ol>
            </li>
            <li>Milk
                <ol>
                    <li>Cow Milk</li>
                    <li>Soy Milk</li>
                </ol>
            </li>
        </ul>
        <br>
        <table>
            <tr>
                <th>Country</th>
                <th>Capital</th>
            </tr>
            <tr>
                <td>India</td>
                <td>New Delhi</td>
            </tr>
            <tr>
                <td>USA</td>
                <td>Washington DC</td>
            </tr>
        </table>
    </body>
</html>`;

// List styles testing HTML content
const listStylesHtml = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>List Styles Test</title>
    </head>
    <body>
        <h1>List Style Types Test</h1>
        
        <h2>Decimal (default)</h2>
        <ol>
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
        </ol>
        
        <h2>Upper Alpha</h2>
        <ol style="list-style-type: upper-alpha;">
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
        </ol>
        
        <h2>Lower Alpha</h2>
        <ol style="list-style-type: lower-alpha;">
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
        </ol>
        
        <h2>Upper Roman</h2>
        <ol style="list-style-type: upper-roman;">
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
        </ol>
        
        <h2>Lower Roman</h2>
        <ol style="list-style-type: lower-roman;">
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
        </ol>
        
        <h2>Lower Alpha Bracket End</h2>
        <ol style="list-style-type: lower-alpha-bracket-end;">
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
        </ol>
        
        <h2>Decimal Bracket End</h2>
        <ol style="list-style-type: decimal-bracket-end;">
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
        </ol>
        
        <h2>Decimal Bracket</h2>
        <ol style="list-style-type: decimal-bracket;">
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
        </ol>
        
        <h2>Custom Start (data-start="5")</h2>
        <ol data-start="5">
            <li>Fifth item</li>
            <li>Sixth item</li>
            <li>Seventh item</li>
        </ol>
        
        <h2>Custom Start with Upper Alpha (data-start="3")</h2>
        <ol style="list-style-type: upper-alpha;" data-start="3">
            <li>Third item (C)</li>
            <li>Fourth item (D)</li>
            <li>Fifth item (E)</li>
        </ol>
    </body>
</html>`;

// Generate example.docx
(async () => {
    try {
        const docx = await HTMLtoDOCX(htmlString, null, {
            orientation: 'portrait',
            margins: {
                top: 1440,
                right: 1800,
                bottom: 1440,
                left: 1800,
            },
        });
        
        fs.writeFileSync(filePath, docx);
        console.log('Generated example.docx successfully!');
    } catch (error) {
        console.error('Error generating example.docx:', error);
    }
})();

// Generate list-styles-test.docx
(async () => {
    try {
        const docx = await HTMLtoDOCX(listStylesHtml, null, {
            orientation: 'portrait',
            margins: {
                top: 1440,
                right: 1800,
                bottom: 1440,
                left: 1800,
            },
        });
        
        fs.writeFileSync(listStylesFilePath, docx);
        console.log('Generated list-styles-test.docx successfully!');
    } catch (error) {
        console.error('Error generating list-styles-test.docx:', error);
    }
})();
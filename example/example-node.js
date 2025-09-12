/* eslint-disable no-console */
const fs = require('fs');
// FIXME: Incase you have the npm package
// const HTMLtoDOCX = require('html-to-docx');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

const filePath = './example.docx';

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
                <td>United States of America</td>
                <td>Washington DC</td>
            </tr>
            <tr>
                <td>Bolivia</td>
                <td>
                    <ol>
                        <li>Sucre</li>
                        <li>La Paz</li>
                    </ol>
                </td>
            </tr>
        </table>

        <div class="page-break" style="page-break-after: always"></div>
        <table align="center" class="Table">
          <tbody>
            <tr>
              <td colspan="2" rowspan="2" style="border-bottom:none; width:249px; padding:5px 11px 5px 11px; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt">&nbsp;</span></span></span></p>
              </td>
              <td colspan="3" style="border-bottom:1px solid black; width:374px; padding:5px 11px 5px 11px; background-color:gray; border-top:1px solid black; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">Example Header</span></span></span></span></p>
              </td>
            </tr>
            <tr>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#d9d9d9; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><b><span style="font-size:10.0pt"><span style="color:black">Financial</span></span></b></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#d9d9d9; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><b><span style="font-size:10.0pt"><span style="color:black">Tech</span></span></b></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#d9d9d9; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><b><span style="font-size:10.0pt"><span style="color:black">Total Market</span></span></b></span></span></span></p>
              </td>
            </tr>
            <tr>
              <td rowspan="3" style="border-bottom:none; width:125px; padding:5px 11px 5px 11px; background-color:gray; border-top:none; border-right:1px solid black; border-left:1px solid black" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><b><span style="font-size:10.0pt"><span style="color:black">Level of Meme</span></span></b></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#d9d9d9; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><b><span style="font-size:10.0pt"><span style="color:black">High</span></span></b></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:red; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">GUSH</span></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#ffc000; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">ARKK</span></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:yellow; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">SPLX</span></span></span></span></p>
              </td>
            </tr>
            <tr>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#d9d9d9; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><b><span style="font-size:10.0pt"><span style="color:black">Medium</span></span></b></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#ffc000; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">[̲̅$̲̅(̲̅ ͡&deg; ͜ʖ ͡&deg;̲̅)̲̅$̲̅]</span></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:yellow; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">TQQQ</span></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#92d050; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">( ͡~ ͜ʖ ͡&deg;)</span></span></span></span></p>
              </td>
            </tr>
            <tr>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#d9d9d9; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><b><span style="font-size:10.0pt"><span style="color:black">Low</span></span></b></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:yellow; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">( ◔ ʖ̯ ◔ )</span></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#92d050; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">QQQ</span></span></span></span></p>
              </td>
              <td style="border-bottom:1px solid black; width:125px; padding:5px 11px 5px 11px; background-color:#00b050; border-top:none; border-right:1px solid black; border-left:none" valign="top">
              <p style="margin-bottom:8px"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size:11pt"><span style="line-height:12pt"><span style="color:black">SPY</span></span></span></span></p>
              </td>
            </tr>
          </tbody>
        </table>
        <ul>
            <li style="margin-bottom:10px">
                <span style="font-size:10pt"><span style="color:#e28743">I am a teacup <strong><span style="color:#595959">A strong teacup</span></strong></span></span>
            </li>
            <li style="margin-bottom:15px">
                <span style="font-size:10pt"><span style="color:#4d4f53">I am another teacup <strong><span style="color:#2596be">A blue</span></strong> Teacup</span></span>
            </li>
            <li style="margin-bottom:20px">
                <span style="font-size:15pt"><span style="color:#cc1177">Stonks only go up if you turn the chart sometimes</span></span>
            </li>
            <li style="margin-bottom:30px">
                <span style="font-size:15pt"><span style="color:#cc1177">One small step for man</span></span>
            </li>
            <li>
                <span style="font-size:30pt"><span style="color:#cc1177">One giant leap for mankind</span></span>
            </li>
            <li>
                <span style="font-size:30pt"><span style="color:#cc1177">Never surrender, no mercy, and never give up!</span></span>
            </li>
        </ul>

        <p>Different borders</p>
        <table
            style="border-collapse: collapse; border-left:1px solid black; border-right: 2px solid brown; border-top: 2px solid yellow; border-bottom: 4px solid orange">
            <tbody>
                <tr>
                    <td>Row 1, Col 1</td>
                    <td>Row 1, Col 2</td>
                </tr>
                <tr>
                    <td>Row 2, Col 1</td>
                    <td>Row 2, Col 2</td>
                </tr>
            </tbody>
        </table>

        <p>Mid Merge Border</p>
        <table class="MsoTableGrid" style="border-collapse: collapse; border: none;" border="1" cellspacing="0" cellpadding="0">
            <tbody>
                <tr>
                    <td style="width: 112.7pt; border: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;" valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border: solid windowtext 1.0pt; border-left: none; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border: solid windowtext 1.0pt; border-left: none; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border: solid windowtext 1.0pt; border-left: none; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 112.7pt; border: solid windowtext 1.0pt; border-top: none; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 225.4pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;"
                        colspan="2" rowspan="2" valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 112.7pt; border: solid windowtext 1.0pt; border-top: none; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 112.7pt; border: solid windowtext 1.0pt; border-top: none; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 112.7pt; border: solid windowtext 1.0pt; border-top: none; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 112.7pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0cm 5.4pt 0cm 5.4pt;"
                        valign="top">
                        <p style="margin: 0cm; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>

        <p>Tiny MCE No Border Case</p>
        <table class="MsoNormalTable" border="0" cellspacing="0" cellpadding="0">
            <tbody>
                <tr>
                    <td style="width: 116.25pt; background: #2F5496; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: white;">Project Phase</span></p>
                    </td>
                    <td style="width: 297.0pt; background: #2F5496; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: white;">Activities in Scope</span></p>
                    </td>
                    <td style="width: 1.25in; background: #2F5496; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: white;">Estimated Hours</span></p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 503.25pt; background: #E7E6E6; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" colspan="3"
                        valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: black;">AWS Cloud Build</span></p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 116.25pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Deploy&nbsp;(4) Nodes within AWS per
                                Region</span></p>
                    </td>
                    <td style="width: 297.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Our Services will assist with onboarding of
                                the remote offices. We believe having three nodes per AWS Region will provide optimal High
                                Availability (HA)</span></p>
                    </td>
                    <td style="width: 1.25in; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">16</span></p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 5.75in; background: #E7E6E6; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" colspan="2"
                        valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: black;">Feedback and Environment
                                Remediation</span></p>
                    </td>
                    <td style="width: 1.25in; background: #E7E6E6; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            &nbsp;</p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 116.25pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Solicit Initial feedback</span></p>
                    </td>
                    <td style="width: 297.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Work with initial pilot user groups to
                                solicit feedback around the performance of the platform.&nbsp;</span></p>
                    </td>
                    <td style="width: 1.25in; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">5</span></p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 116.25pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Environment Remediation</span></p>
                    </td>
                    <td style="width: 297.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Our Services will allocate up
                                to&nbsp;<strong>15&nbsp;project-hours</strong>&nbsp;for initial remediation as part of this
                                engagement. Should more hours be needed, we will discuss it with the client project
                                lead&nbsp;and provide an addendum to this scope definition upon mutual agreement.</span></p>
                    </td>
                    <td style="width: 1.25in; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">20</span></p>
                    </td>
                </tr>
            </tbody>
        </table>

        <p>Tiny MCE Normal Case</p>
        <table class="MsoNormalTable" style="border: solid black 1.0pt;" border="1" cellspacing="0" cellpadding="0">
            <tbody>
                <tr>
                    <td style="width: 116.25pt; border: solid black 1.0pt; background: #2F5496; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: white;">Project Phase</span>
                        </p>
                    </td>
                    <td style="width: 297.0pt; border: solid black 1.0pt; background: #2F5496; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: white;">Activities in Scope</span>
                        </p>
                    </td>
                    <td style="width: 1.25in; border: solid black 1.0pt; background: #2F5496; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: white;">Estimated Hours</span>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 503.25pt; border: solid black 1.0pt; background: #E7E6E6; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        colspan="3" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: black;">AWS Cloud Build</span>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 116.25pt; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Deploy&nbsp;(4) Nodes within AWS per
                                Region</span>
                        </p>
                    </td>
                    <td style="width: 297.0pt; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Our Services will assist with onboarding of the
                                remote offices. We believe having three nodes per AWS Region will provide optimal High
                                Availability (HA)</span>
                        </p>
                    </td>
                    <td style="width: 1.25in; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">16</span>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 5.75in; border: solid black 1.0pt; background: #E7E6E6; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        colspan="2" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%; color: black;">Feedback and Environment
                                Remediation</span>
                        </p>
                    </td>
                    <td style="width: 1.25in; border: solid black 1.0pt; background: #E7E6E6; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            &nbsp;</p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 116.25pt; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Solicit Initial feedback</span>
                        </p>
                    </td>
                    <td style="width: 297.0pt; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Work with initial pilot user groups to solicit
                                feedback around the performance of the platform.&nbsp;</span>
                        </p>
                    </td>
                    <td style="width: 1.25in; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">5</span>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="width: 116.25pt; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Environment Remediation</span>
                        </p>
                    </td>
                    <td style="width: 297.0pt; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">Our Services will allocate up
                                to&nbsp;<strong>15&nbsp;project-hours</strong>&nbsp;for initial remediation as part of this
                                engagement. Should more hours be needed, we will discuss it with the client project
                                lead&nbsp;and provide an addendum to this scope definition upon mutual agreement.</span>
                        </p>
                    </td>
                    <td style="width: 1.25in; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p style="margin: 0in 0in 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;">
                            <span style="font-size: 12.0pt; line-height: 107%;">20</span>
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>

        <p>Tiny MCE Shapes Case</p>
        <table class="MsoTableGrid" style="width: 624px; border-collapse: collapse; border: none; height: 96.5px;" border="1"
            cellspacing="0" cellpadding="0">
            <tbody>
                <tr style="height: 19px;">
                    <td style="width: 117pt; border: 1pt solid black; background: rgb(68, 114, 196); padding: 0in 5.4pt; height: 19px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;"><span
                                style="color: white;">Test table1</span></p>
                    </td>
                    <td style="width: 117pt; border-top: 1pt solid black; border-right: 1pt solid black; border-bottom: 1pt solid black; border-image: initial; border-left: none; background: rgb(68, 114, 196); padding: 0in 5.4pt; height: 19px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;"><span
                                style="color: white;">Test table2</span></p>
                    </td>
                    <td style="width: 117pt; border-top: 1pt solid black; border-right: 1pt solid black; border-bottom: 1pt solid black; border-image: initial; border-left: none; padding: 0in 5.4pt; height: 19px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">Test
                            co3l3</p>
                    </td>
                    <td style="width: 117pt; border-top: 1pt solid black; border-right: 1pt solid black; border-bottom: 1pt solid black; border-image: initial; border-left: none; background: rgb(237, 125, 49); padding: 0in 5.4pt; height: 19px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;"><span
                                style="color: black;">Shad here</span></p>
                    </td>
                </tr>
                <tr style="height: 19px;">
                    <td style="width: 117pt; border-top: none; border-left: 1pt solid black; border-bottom: 1pt solid windowtext; border-right: 1pt solid black; padding: 0in 5.4pt; height: 38px;"
                        rowspan="2" valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 117pt; border-top: none; border-left: none; border-bottom: 1pt solid black; border-right: 1pt solid black; padding: 0in 5.4pt; height: 19px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 117pt; border-top: none; border-left: none; border-bottom: 1pt solid black; border-right: 1pt solid black; padding: 0in 5.4pt; height: 19px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 117pt; border-top: none; border-left: none; border-bottom: 1pt solid black; border-right: 1pt solid black; padding: 0in 5.4pt; height: 19px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                </tr>
                <tr style="height: 19px;">
                    <td style="width: 117pt; border-top: none; border-left: none; border-bottom: 1pt solid windowtext; border-right: 1pt solid black; padding: 0in 5.4pt; height: 19px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 3.25in; border-top: none; border-left: none; border-bottom: 1pt solid black; border-right: 1pt solid black; padding: 0in 5.4pt; height: 19px;"
                        colspan="2" valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                </tr>
                <tr style="height: 19.5px;">
                    <td style="width: 117pt; border: none; padding: 0in 5.4pt; height: 19.5px;" valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 117pt; border-top: none; border-bottom: none; border-left: none; border-image: initial; border-right: 1pt solid windowtext; padding: 0in 5.4pt; height: 19.5px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 117pt; border-top: none; border-left: none; border-bottom: 1pt solid rgb(0, 176, 80); border-right: 1pt solid black; padding: 0in 5.4pt; height: 19.5px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 117pt; border-top: none; border-left: none; border-bottom: 1pt solid rgb(237, 125, 49); border-right: 1pt solid black; padding: 0in 5.4pt; height: 19.5px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                </tr>
                <tr style="height: 20px;">
                    <td style="width: 117pt; border: none; padding: 0in 5.4pt; height: 20px;" valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 117pt; border-top: none; border-bottom: none; border-left: none; border-image: initial; border-right: 1pt solid windowtext; padding: 0in 5.4pt; height: 20px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 117pt; border-top: none; border-left: none; border-bottom: 1pt solid rgb(0, 176, 80); border-right: 1pt solid rgb(237, 125, 49); padding: 0in 5.4pt; height: 20px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                    <td style="width: 117pt; border-top: none; border-left: none; border-bottom: 1pt solid rgb(237, 125, 49); border-right: 1pt solid rgb(237, 125, 49); padding: 0in 5.4pt; height: 20px;"
                        valign="top">
                        <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;">&nbsp;
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>
        <p>Border only on table with Collapse</p>
        <table border="1" style="border-collapse:collapse">
            <tbody>
                <tr>
                    <td style="border-left:none">HELLO WORLDD</td>
                    <td>Check Here</td>
                </tr>
            </tbody>
        </table>

        <p>Shapes but with border property on rowspan</p>
        <table class="MsoNormalTable" style="border-collapse: collapse;" border="0" cellspacing="0" cellpadding="0">
        <tbody>
            <tr style="page-break-inside: avoid;">
                <td style="width: 186.75pt; border: none; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    colspan="2" rowspan="2" valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        &nbsp;</p>
                </td>
                <td style="width: 280.5pt; border: solid black 1.0pt; border-left: none; background: gray; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    colspan="3" valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">Example Header</span>
                    </p>
                </td>
            </tr>
            <tr style="page-break-inside: avoid;">
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #D9D9D9; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <strong><span
                                style="font-size: 10.0pt; font-family: Arial, sans-serif; color: black;">Financial</span></strong>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #D9D9D9; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <strong><span
                                style="font-size: 10.0pt; font-family: Arial, sans-serif; color: black;">Tech</span></strong>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #D9D9D9; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <strong><span style="font-size: 10.0pt; font-family: Arial, sans-serif; color: black;">Total
                                Market</span></strong>
                    </p>
                </td>
            </tr>
            <tr style="page-break-inside: avoid;">
                <td style="width: 93.75pt; border-top: none; border-left: solid black 1.0pt; border-bottom: none; border-right: solid black 1.0pt; background: gray; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    rowspan="3" valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <strong><span style="font-size: 10.0pt; font-family: Arial, sans-serif; color: black;">Level of
                                Meme</span></strong>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #D9D9D9; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <strong><span
                                style="font-size: 10.0pt; font-family: Arial, sans-serif; color: black;">High</span></strong>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: red; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">GUSH</span>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #FFC000; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">ARKK</span>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: yellow; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">SPLX</span>
                    </p>
                </td>
            </tr>
            <tr style="page-break-inside: avoid;">
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #D9D9D9; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <strong><span
                                style="font-size: 10.0pt; font-family: Arial, sans-serif; color: black;">Medium</span></strong>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #FFC000; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">[̲̅$̲̅(̲̅ ͡&deg; ͜ʖ
                            ͡&deg;̲̅)̲̅$̲̅]</span>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: yellow; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">TQQQ</span>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #92D050; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">( ͡~ ͜ʖ ͡&deg;)</span>
                    </p>
                </td>
            </tr>
            <tr style="page-break-inside: avoid;">
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #D9D9D9; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <strong><span
                                style="font-size: 10.0pt; font-family: Arial, sans-serif; color: black;">Low</span></strong>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: yellow; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">( ◔ ʖ̯ ◔ )</span>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #92D050; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">QQQ</span>
                    </p>
                </td>
                <td style="width: 93.75pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; background: #00B050; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                    valign="top">
                    <p
                        style="margin: 0in 0in 6pt; line-height: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                        <span style="font-family: Arial, sans-serif; color: black;">SPY</span>
                    </p>
                </td>
            </tr>
        </tbody>
    </table>
    <p>&nbsp;</p>
    <div align="center">
        <table class="MsoNormalTable" style="width: 6.0in; border-collapse: collapse; border: none;" border="1"
            cellspacing="0" cellpadding="0">
            <tbody>
                <tr style="page-break-inside: avoid; height: 14.25pt;">
                    <td style="width: 117.0pt; border: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span style="font-family: Calibri, sans-serif; color: white;">Test table1</span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border: solid black 1.0pt; border-left: none; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span style="font-family: Calibri, sans-serif; color: white;">Test table2</span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border: solid black 1.0pt; border-left: none; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">Test&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                co3l3</span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border: solid black 1.0pt; border-left: none; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span style="font-family: Calibri, sans-serif; color: black;">Shad here</span>
                        </p>
                    </td>
                </tr>
                <tr style="page-break-inside: avoid; height: 14.25pt;">
                    <td style="width: 117.0pt; border: solid black 1.0pt; border-top: none; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        rowspan="2" valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                </tr>
                <tr style="page-break-inside: avoid; height: 14.25pt;">
                    <td style="width: 117.0pt; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                    <td style="width: 3.25in; border-top: none; border-left: none; border-bottom: solid black 1.0pt; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        colspan="2" valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                </tr>
                <tr style="page-break-inside: avoid; height: 14.65pt;">
                    <td style="width: 117.0pt; border: none; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border: none; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border-top: none; border-left: none; border-bottom: solid #00B050 1.0pt; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border-top: none; border-left: none; border-bottom: solid #ED7D31 1.0pt; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                </tr>
                <tr style="page-break-inside: avoid; height: 15.0pt;">
                    <td style="width: 117.0pt; border: none; padding: 4.0pt 8.0pt 4.0pt 8.0pt;" valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border: none; border-right: solid black 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span style="font-family: Calibri, sans-serif;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border-top: none; border-left: none; border-bottom: solid #00B050 1.0pt; border-right: solid #ED7D31 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                    <td style="width: 117.0pt; border-top: none; border-left: none; border-bottom: solid #ED7D31 1.0pt; border-right: solid #ED7D31 1.0pt; padding: 4.0pt 8.0pt 4.0pt 8.0pt;"
                        valign="top">
                        <p
                            style="line-height: normal; margin: 0in 0in 6pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
                            <span
                                style="font-family: Calibri, sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>
        <p>Some more border cases</p>
        <p>Changed the border style to none</p>
        <table style="border-collapse: collapse; width: 100%; border-width: 1px; border-style: none;" border="1">
            <colgroup>
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
            </colgroup>
            <tbody>
                <tr>
                    <td>1,1</td>
                    <td>1,2</td>
                    <td>1,3</td>
                    <td>1,4</td>
                </tr>
                <tr>
                    <td>2,1</td>
                    <td>2,2</td>
                    <td>2,3</td>
                    <td>2,4</td>
                </tr>
                <tr>
                    <td>3,1</td>
                    <td>3,2</td>
                    <td>3,3</td>
                    <td>3,4</td>
                </tr>
                <tr>
                    <td>4,1</td>
                    <td>4,2</td>
                    <td>4,3</td>
                    <td>4,4</td>
                </tr>
            </tbody>
        </table>
        <p>&nbsp;</p>
        <p>here just normal table insertion</p>
        <table style="border-collapse: collapse; width: 100%; height: 76px;" border="1">
            <colgroup>
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
            </colgroup>
            <tbody>
                <tr style="height: 19px;">
                    <td style="height: 19px;">1,1</td>
                    <td style="height: 19px;">1,2</td>
                    <td style="height: 19px;">1,3</td>
                    <td style="height: 19px;">1,4</td>
                </tr>
                <tr style="height: 19px;">
                    <td style="height: 19px;">2,1</td>
                    <td style="height: 19px;">2,2</td>
                    <td style="height: 19px;">2,3</td>
                    <td style="height: 19px;">2,4</td>
                </tr>
                <tr style="height: 19px;">
                    <td style="height: 19px;">3,1</td>
                    <td style="height: 19px;">3,2</td>
                    <td style="height: 19px;">3,3</td>
                    <td style="height: 19px;">3,4</td>
                </tr>
                <tr style="height: 19px;">
                    <td style="height: 19px;">4,1</td>
                    <td style="height: 19px;">4,2</td>
                    <td style="height: 19px;">4,3</td>
                    <td style="height: 19px;">4,4</td>
                </tr>
            </tbody>
        </table>
        <p>&nbsp;</p>
        <p>here changed border style to hidden</p>
        <table style="border-collapse: collapse; width: 100%; border-width: 1px; border-style: hidden; height: 76px;" border="1">
            <colgroup>
                <col style="width: 25.0399%;">
                <col style="width: 25.0399%;">
                <col style="width: 25.0399%;">
                <col style="width: 25.0399%;">
            </colgroup>
            <tbody>
                <tr style="height: 19px;">
                    <td style="height: 19px;">1,1</td>
                    <td style="height: 19px;">1,2</td>
                    <td style="height: 19px;">1,3</td>
                    <td style="height: 19px;">1,4</td>
                </tr>
                <tr style="height: 19px;">
                    <td style="height: 19px;">2,1</td>
                    <td style="height: 19px;">2,2</td>
                    <td style="height: 19px;">2,3</td>
                    <td style="height: 19px;">2,4</td>
                </tr>
                <tr style="height: 19px;">
                    <td style="height: 19px;">3,1</td>
                    <td style="height: 19px;">3,2</td>
                    <td style="height: 19px;">3,3</td>
                    <td style="height: 19px;">3,4</td>
                </tr>
                <tr style="height: 19px;">
                    <td style="height: 19px;">4,1</td>
                    <td style="height: 19px;">4,2</td>
                    <td style="height: 19px;">&nbsp;4,3</td>
                    <td style="height: 19px;">4,4</td>
                </tr>
            </tbody>
        </table>
        <p>&nbsp;</p>
        <p>Here removing the border but adding styles</p>
        <table style="border-collapse: collapse; width: 100%; border-width: 0px; border-style: solid;" border="1">
            <colgroup>
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
            </colgroup>
            <tbody>
                <tr>
                    <td style="border-width: 0px;">1,1</td>
                    <td style="border-width: 0px;">1,2</td>
                    <td style="border-width: 0px;">1,3</td>
                    <td style="border-width: 0px;">1,4</td>
                </tr>
                <tr>
                    <td style="border-width: 0px;">2,1</td>
                    <td style="border-width: 0px;">2,2</td>
                    <td style="border-width: 0px;">2,3</td>
                    <td style="border-width: 0px;">2,4</td>
                </tr>
                <tr>
                    <td style="border-width: 0px;">3,1</td>
                    <td style="border-width: 0px;">3,2</td>
                    <td style="border-width: 0px;">3,3</td>
                    <td style="border-width: 0px;">3,4</td>
                </tr>
                <tr>
                    <td style="border-width: 0px;">4,1</td>
                    <td style="border-width: 0px;">4,2</td>
                    <td style="border-width: 0px;">4,3</td>
                    <td style="border-width: 0px;">4,4</td>
                </tr>
            </tbody>
        </table>
        <p>&nbsp;</p>
        <p>changing once again to hidden without copy</p>
        <table style="border-collapse: collapse; width: 100%; border-width: 1px; border-style: hidden;" border="1">
            <colgroup>
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
            </colgroup>
            <tbody>
                <tr>
                    <td>1,1</td>
                    <td>1,2</td>
                    <td>1,3</td>
                    <td>1,4</td>
                </tr>
                <tr>
                    <td>2,1</td>
                    <td>2,2</td>
                    <td>2,3</td>
                    <td>2,4</td>
                </tr>
                <tr>
                    <td>3,1</td>
                    <td>3,2</td>
                    <td>3,3</td>
                    <td>3,4</td>
                </tr>
                <tr>
                    <td>4,1</td>
                    <td>4,2</td>
                    <td>4,3</td>
                    <td>4,4</td>
                </tr>
            </tbody>
        </table>
        <p>Many styles</p>
        <table style="border-collapse: collapse; width: 100%; border: 2px solid purple; border-width: 4px; border-left-color:yellow;" border="1">
            <colgroup>
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
            </colgroup>
            <tbody>
                <tr>
                    <td style="border:5px dotted red; border-left: 2px dashed ;border-left-color:aqua">1,1</td>
                    <td>1,2</td>
                    <td>1,3</td>
                    <td>1,4</td>
                </tr>
                <tr>
                    <td style="border:5px dotted red; border-left: 8px dashed ;border-left-color:aqua">2,1</td>
                    <td>2,2</td>
                    <td>2,3</td>
                    <td>2,4</td>
                </tr>
                <tr>
                    <td>3,1</td>
                    <td>3,2</td>
                    <td>3,3</td>
                    <td style="border:5px dotted red; border-right: 2px dashed ;border-right-color:aqua">3,4</td>
                </tr>
                <tr>
                    <td style="border:3px dashed blue; border-left: 2px solid ;border-left-color:aqua; border-bottom-stlye: double; border-bottom-width: 6px; border-bottom-color: magenta">4,1</td>
                    <td>4,2</td>
                    <td>4,3</td>
                    <td style="border:5px dotted red; border-left: 2px dashed ;border-left-color:aqua; border-bottom:5px dashed blue">4,4</td>
                </tr>
            </tbody>
        </table>
        <p>
        Adding one table with height in px and one with height in percentages
        Percentage height table
        </p>
        <table style="border-collapse: collapse; width: 100.05%; height: 75%;" border="1">
            <colgroup>
                <col style="width: 33.2506%;">
                <col style="width: 33.2506%;">
                <col style="width: 33.2506%;">
            </colgroup>
            <tbody>
                <tr style="height: 10%;">
                    <td>1,1</td>
                    <td>1,2</td>
                    <td>1,3</td>
                </tr>
                <tr style="height: 20%;">
                    <td>2,1</td>
                    <td>2,2</td>
                    <td>2,3</td>
                </tr>
                <tr style="height: 85px;">
                    <td>3,1</td>
                    <td>3,2</td>
                    <td>3,3</td>
                </tr>
            </tbody>
        </table>
        <p>px Height table</p>
        <table style="border-collapse: collapse; width: 100.05%; height: 178px;" border="1">
            <colgroup>
                <col style="width: 33.2506%;">
                <col style="width: 33.2506%;">
                <col style="width: 33.2506%;">
            </colgroup>
            <tbody>
                <tr style="height: 10%;">
                    <td>1,1</td>
                    <td>1,2</td>
                    <td>1,3</td>
                </tr>
                <tr style="height: 20%;">
                    <td>2,1</td>
                    <td>2,2</td>
                    <td>2,3</td>
                </tr>
                <tr style="height: 85px;">
                    <td>3,1</td>
                    <td>3,2</td>
                    <td>3,3</td>
                </tr>
            </tbody>
        </table>

        <p>Here we start with Images Case</p>
        <pre>
        Inside Pre tag
            <img style="width: 512px; height: 400px;" src="data:image/png;base64,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" />
        </pre>
        <br/>
        <strong>
            Inside strong tag
            <img style="width: 512px; height: 400px;" src="data:image/png;base64,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" />
        </strong>
        <br/>
        <span>
            Inside span tag
            <img style="width: 512px; height: 400px;" src="data:image/png;base64,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" />
        </span>
        <br/>
        <code>
            Inside code tag
            <img style="width: 512px; height: 400px;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAGQCAIAAABXlE9zAAALiElEQVR4nOzXfa/YdX3G8Z56oFjLqIMjZSDYFcJdIxlGFhiYBrmrCsKYwqAoOI2D0RruBIdFg2m1gkPWKralzTpda9NWC2s5G53gzlYLbFMLbSpo0dIbnaKlYrVIgT2KK1lyvV4P4Pomvz9+73wGr/rU8KikRfcsy+6/f0V0f8yV34rur/zVY9H9pYfdHt2/8wND0f1PLD4iuj/q0/8SnT/n6luj+7/cvjy6f/VnZkX3l97y3uj+7JM/G92/ZN7c6P6x//vN6P7o6DoA/28JAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUGrwp2sfij7w62u+Ft0/9CfXR/cP+cm+6P6DS98R3X/T5r+I7j/wwl9F9+dPuyC6//sL5kX3T1m8Prr/i8lXRvd/+7a10f1Df7olur/pvEOj+5v3To/urztmOLrvAgAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAECpgV0zZkYf2PD6MdH9j+6ZEN0/avvy6P7ou8ZF9zevek90f+iyx6L77/vxYdH94TlHRvdPedec6P4jP5oY3b/z8Luj+zt2jI3uP3Z8dH7Uz296Irq/aOl/RPddAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACg1uP2486MPHPk3X4zuv/ryDdH9DbdMju5fedm+6P7La3dG9z9x8ovR/Q/fcm90/60br4nunzb4SnR/8UOro/svv/PT0f1J37w5uj92/v3R/e/cty66f/+5/xzddwEAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACg1MARE5dGH7j58Wuj+x8a/8Ho/ue+sjy6P3rq2uj+lDdvju7fd8fe6P62g3dF99c8MCa6P7Lo9uj+HSfNiO5ftWNSdP+TXzopu7/p4Oj+gb8+Lrr/hhveGt13AQCUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKDU4A8nbI4+cNNz10f3H5l8YXR/44Kd0f2Zp94b3T9n8dzo/ri/nRrdn7D1qOj+/DMXRvc3/9sp0f1ll02J7j/89Lej+/8z+p3R/U2zt0X3X/rNquj+/GNmRvddAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACg1uO1HN0Qf+OKUhdH9BTfOje7/55VXR/fXfO/F6P4dzy2J7r939Hej+6c/fl10f98Dn4zun7h3WXR/y/C46P7QzQPR/aN/8JHo/qS/3BjdH3/W0dH9gQvfGN13AQCUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKDUwNeveEv0gW8de210/+iLxkX37/rU7Oj+ffsvju7/7IDh6P7Rn/9tdP93r50Q3R815e3R+b9f9NXo/oyrTozuP/HqhOj+gfsGovt/fvG06P7Kueuj+0PzdkX3XQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoNfiGM66LPvCZw34Z3Z/zyqnR/ZtuOzu6f/FI9vt/Y+vt0f03DTwY3d/417Oi+0/fuy66f88RJ0b3P7txQ3T/lF9Niu7PeHZ2dP/dD94T3d895uno/sQla6L7LgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUGnj8mh3RByZN+3h0/x/f+HfR/eGRRdH9Rb94Lbq/4oo3R/eXnftcdP+aWzdF98d/5A+j+/uf/XB0/6Jty6L768duie4/uWVMdH/Dnn3R/XuOOju6//XvT4vuuwAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQauBPZ5wWfeDuL90V3Z93/q7o/hlfOT26P/Z3L0X3rz11dXR/yeB/R/dvnHxQdH/68x+K7q85eWZ0f9LZF0b3V11wXnR/7N7s/+e/npod3f/Ga/Oj+9++aGV03wUAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUoOH/+zS6AOHrj4tur/k+D3R/edXDEX319zytuj+adtujO6/5WMLovuXDH05uj9r7Z9E93evuzO6v/wDT0T3f3/5sdH9i763M7o/4/i90f3pi1dE9y+f+uPovgsAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQZXnvGD6AMHjb89un/m9fuj+weMmxXdf+bhp6L7l5x1Z3R/yfap0f2Zbz8kuj+07Mzo/jFf2B3dv/TRr0X3X5x6eXT/u++eHN1fe8jrovujxzwb3T9j6+zovgsAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQaOmnhm9IE5q/4huj/7tpei++NvuCy6//CjW6P7A9sPjO7vefI30f2Df746uv/9OUui+8e/cmt0/4S7fxjdX/i5S6L7//6+w6P77xgzK7r/nbmvi+5/dOTL0X0XAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoNrpw3HH3goOkTo/vvX3ZedP/mP3goun/MC9H5UUesOT26f93r/zW6P7L3iuj+xy54T3T/0bNOiO7vP31mdP+p3dOj+x+c8Pno/iOzTorubzvs0uj+F4aej+67AABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBqYP8JC6IPTPn48uj+3C07o/sjr2a/z8j6GdH9P3vXxOj+FXvWRPefGb4tun/AtpHo/rTzn4zuL3zh3Oj+M/dm96f805HR/fu/+kfR/T/euT66f9w5c6L7LgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACU+r8AAAD//wWzgwaiDZdbAAAAAElFTkSuQmCC" />
        </code>
        <br/>
        <i>
            Inside i tag
            <img style="width: 512px; height: 400px;" src="data:image/png;base64,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" />
        </i>

        <br/>
        <p>Now we check for images in Link forms</p>
        <p>
            Inside p tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </p>

        <span>
            Inside span tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </span>

        <strong>
            Inside strong tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </strong>

        <b>
            Inside b tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </b>

        <i>
            Inside i tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </i>

        <p>
         paragraph <strong>temporary</strong> <em>lorem</em> <u>test tag</u>
        </p>

        <em>
            Inside em tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </em>

        <pre>
            Inside pre tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </pre>

        <code>
            Inside code tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </code>

        <a>
            Inside a tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </a>

        <del>
            Inside del tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </del>

        <sub>
            Inside sub tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </sub>

        <strike>
            Inside strike tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </strike>

        <s>
            Inside s tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </s>

        <sub>
            Inside sub tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </sub>

        <sup>
            Inside sup tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </sup>

        <mark>
            Inside mark tag
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" />
        </mark>

        <p>Here we check for multiple elements inside anchor tag</p>
        <a>
            <span>Inside a and span</span>
            <strong> Inside a and strong</strong>
            <i>Inside italics and a</i>
        </a>

        <p>Here we check for text-transform properties</p>
        <p style="text-transform: uppercase">
            Adding one value
            <span style="text-transform:lowercase;">this is lowercase </span>
            <strong style="text-transform:capitalize;">
                <i style="text-transform:uppercase">this capitalized </i>
                <span style="color: blue">Hello world </span>
                <span>capitalize should happen inside</span>
            </strong>
            <span>Uppercase not other changes</span>
        </p>

        <p style="text-transform: uppercase">
            Adding one value
            <span style="text-transform:lowercase;">this is lowercase </span>
            <strong style="text-transform:capitalize;">
                <i >this capitalized </i>
                <span style="color: blue">heLLo world </span>
                <span>capitalize should happen  inside</span>
            </strong>
            <span>Uppercase not other changes</span>
        </p>

        <p style="text-transform: uppercase">
            Adding one value <span style="text-transform:lowercase;"> this is lowercase </span> <strong style="text-transform:capitalize;">
            <i>this capitalized</i>
            <span style="color: blue">Hello world</span>
            <span>no change should happen here</span>
        </strong>
        </p>

        <div>
            <p>
                Here we check for text-decoration properties:
                <p style="text-decoration: dashed underline red">
                    This is an underline text.
                </p>
                <strong style="text-decoration: wavy overline lime">
                    This is an overline text in strong tag.
                </strong>
                <span style="text-decoration: line-through red">
                    This is line-through text in span tag.
                </span>
                <p style="text-decoration: underline overline line-through blue">
                    This line has underline, overline and line-through styles in p tag.
                </p>
                <p style="text-decoration-style: dotted">
                    This line has dotted underline styles in p tag.
                </p>
                <p style="text-decoration-line: line-through">
                    This line has line-through styles in p tag.
                </p>
                <p style="text-decoration-color: orange">
                    This line has orange underline style in p tag.
                </p>
                <p style="text-decoration:underline orange">
                    <span style="text-decoration: line-through red">
                        Hey, here I lie within <strong style="text-decoration: overline;">the strong tag</strong>
                        and now
                    </span> oustide every tag
                </p>
            </p>
        </div>

        <div>
            <span style="text-shadow: 1px 1px 2px grey;">Add new domain</span> to Google Workspace
            <p style="text-shadow: 1px 1px 2px grey;">This text has shadow.<strong> And this has shadow with strong tag.</strong> </p>
            <p style="text-shadow:">This text has empty shadow property.</p>
            <p style="text-shadow: none">This text has none shadow property.</p>
        </div>

        <p>Some tr styles cases</p>
        <p>Color property only passed to tr</p>
        <div align="left">
            <table style="border: none rgb(0, 0, 0); border-collapse: collapse;" border="1">
                <colgroup>
                    <col style="width: 403px;">
                    <col style="width: 221px;">
                </colgroup>
                <tbody>
                    <tr style="background-color: rgb(0, 0, 0);">
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(243, 243, 243);">Service</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(243, 243, 243);">Rate</span></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 1</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$175/hr</span></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 2</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$145/hr</span></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 3</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$125/hr</span></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 4</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$105/hr</span></p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p>Common properties and some only to tr</p>
        <div align="left">
            <table style="border: none rgb(0, 0, 0); border-collapse: collapse;" border="1">
                <colgroup>
                    <col style="width: 403px;">
                    <col style="width: 221px;">
                </colgroup>
                <tbody>
                    <tr style="background-color: rgb(0, 0, 0); color:purple; font-family: cursive; font-size: 16pt; font-weight:bold;">
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; color: rgb(243, 243, 243);">Service</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(243, 243, 243);">Rate</span></p>
                        </td>
                    </tr>
                    <tr style="color:aqua">
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif;">Value 1</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$175/hr</span></p>
                        </td>
                    </tr>
                    <tr style="font-size: 20pt">
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 2</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style=" font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$145/hr</span></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 3</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$125/hr</span></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 4</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$105/hr</span></p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p>Checking Rowspan with style attribute to tr</p>
        <div align="left">
            <table style="border: none rgb(0, 0, 0); border-collapse: collapse;" border="1">
                <colgroup>
                    <col style="width: 403px;">
                    <col style="width: 221px;">
                </colgroup>
                <tbody>
                    <tr style="background-color: rgb(0, 0, 0); color:purple; font-family: cursive; font-size: 16pt; font-weight:bold;">
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);" rowspan="2">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; color: rgb(243, 243, 243);">Service</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(243, 243, 243);">Rate</span></p>
                        </td>
                    </tr>
                    <tr style="color:aqua">
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif;">Value 1</span></p>
                        </td>
                    </tr>
                    <tr style="font-size: 20pt">
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 2</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style=" font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$145/hr</span></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 3</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$125/hr</span></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">Value 4</span></p>
                        </td>
                        <td style="vertical-align: top; border: 1pt solid rgb(0, 0, 0);">
                            <p style="line-height: 1.2; margin-top: 0pt; margin-bottom: 0pt;"><span style="font-size: 11pt; font-family: 'Open Sans', sans-serif; color: rgb(105, 93, 70);">$105/hr</span></p>
                        </td>
                    </tr>
                </tbody>
            </table>

        <p>Some list examples here </p>
        </div>
        <ul type="1">
            <li><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;">Heading 1</span>
                <ul type="a">
                    <li style="font-family: 'Times New Roman', Times, serif; line-height:125%"><span style="font-family: 'Times New Roman', Times, serif; font-size: 12pt;">Sub bullet 1</span></li>
                    <li style="font-family: arial, helvetica, sans-serif; font-size: 12pt; line-height:32px"><span>Sub bullet 2</span></li>
                    <li style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;">Sub bullet 3</span></li>
                    <li style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><span style="font-family: 'Comic Sans MS', cursive; font-size: 12pt; line-height:64pt;">sub bullet 4</span></li>
                    <li style="font-family: 'Lucida Console', 'Courier New', monospace; font-size: 12pt; line-height:5in">Sub bullet 5</li>
                </ul>
            </li>
            <li style="font-family: arial, helvetica, sans-serif; font-size: 12pt; line-height: 1.15;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;">Heading 2</span>6
                <ul type="1">
                    <li style="font-size: 12pt; line-height: 1.15;"><span style=" font-size: 12pt;">Sub bullet 6</span></li>
                    <li style="font-family: arial, helvetica, sans-serif; font-size: 12pt; line-height: 1.15;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;">Sub bullet 6</span></li>
                </ul>
            </li>
            <li style="font-family: arial, helvetica, sans-serif; font-size: 12pt; line-height: 1.15;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;">Heading 3</span></li>
        </ul>   
        <div>
            <p>One More test case</p>
            <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;"><strong><span style="font-size: 10.0pt; font-family: Arial, sans-serif;">PHASE ONE</span></strong><br /><strong><span style="font-size: 10.0pt; font-family: Arial, sans-serif; color: red;">CONFIDENTIAL <br />HOURS: 1 – 2</span></strong></p>
            <p style="margin: 0in; line-height: normal; font-size: 11pt; font-family: Calibri, sans-serif;"><strong><span style="font-size: 10.0pt; font-family: Arial, sans-serif; color: red;">TIER: 1 </span></strong></p>
            <p style="line-height: normal; margin: 0in 0in 10pt; font-size: 11pt; font-family: Calibri, sans-serif;"><strong><span style="font-size: 10.0pt; font-family: Arial, sans-serif;">Scheduled Work</span></strong><span style="font-size: 10.0pt; font-family: Arial, sans-serif;">: Business Hours </span><br /><strong><span style="font-size: 10.0pt; font-family: Arial, sans-serif;">Location:</span></strong>
                <span style="font-size: 10.0pt; font-family: Arial, sans-serif;"> Remote</span>
            </p>
            <ul style="margin-bottom: 0in; margin-top: 0px;">
                <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Item 1k</span>
                    <ul style="list-style-type: circle; margin-bottom: 0in; margin-top: 0px;">
                        <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Sub item 1</span></li>
                        <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Sub item 2</span></li>
                        <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Sub item 3</span></li>
                        <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Sub item 4</span></li>
                        <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Sub item 5</span></li>
                        <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Sub item 6</span></li>
                    </ul>
                </li>
                <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Item 2</span>
                    <ul style="list-style-type: circle; margin-bottom: 0in; margin-top: 0px;">
                        <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Sub item 1</span></li>
                        <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Sub item 2</span></li>
                        <li style="line-height: normal; margin: 0in 0in 10pt 0px; font-size: 11pt; font-family: Calibri, sans-serif;"><span style="font-size: 9.0pt; font-family: Arial, sans-serif;">Sub item 1</span></li>
                    </ul>
                </li>
            </ul>
        </div>
        <div>
            <p>Table with empty row that could corrupt</p>
                <table style="border-collapse: collapse; width: 100%; margin-top: 20px;" cellspacing="0">
            <thead>
                <tr>
                <th style="background-color: #0e693a; color: #ffffff; border: 1px solid #000; padding: 8px;">Task</th>
                <th style="background-color: #0e693a; color: #ffffff; border: 1px solid #000; padding: 8px;">Frequency</th>
                </tr>
            </thead>
            <tbody>
            <tr>
            <td style="font-weight: bold; text-align: center; color: #1274b5; border: 1px solid #000; padding: 8px;" colspan="2">Showroom</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Wipe down display cars</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Clean glass walls &amp; windows</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Mop &amp; polish floors</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Dust furniture &amp; charging stations</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="font-weight: bold; text-align: center; color: #1274b5; border: 1px solid #000; padding: 8px;" colspan="2">Service Bay</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Sweep &amp; mop floors</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Empty trash &amp; oil disposal bins</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Clean workbenches &amp; tool areas</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Wipe down customer drop-off zone</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="font-weight: bold; text-align: center; color: #1274b5; border: 1px solid #000; padding: 8px;" colspan="2">Waiting Area</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Vacuum carpets &amp; seating</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Sanitize coffee station &amp; touchscreens</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Restock magazines &amp; charging cables</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="font-weight: bold; text-align: center; color: #1274b5; border: 1px solid #000; padding: 8px;" colspan="2">Restrooms</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Refill soap &amp; paper products</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Disinfect sinks &amp; counters</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Mop floors</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr>
            <td style="font-weight: bold; text-align: center; color: #1274b5; border: 1px solid #000; padding: 8px;" colspan="2">Employee Lounge</td>
            </tr>
            <tr>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Wipe tables &amp; kitchen counters</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000000;">Daily</td>
            </tr>
            <tr></tr>
            </tbody>
            </table>
            <div>
                <p>Testing for paragraph after table spacing if addSpacingAfterTable is true or false</p>
                <table
                    style="
                        border-collapse: collapse;
                        border-left: 1px solid black;
                        border-right: 2px solid brown;
                        border-top: 2px solid yellow;
                        border-bottom: 4px solid orange;
                        margin: 0;
                        padding: 0;
                    "
                >
                    <tbody>
                        <tr>
                            <td>Row 1, Col 1</td>
                            <td>Row 1, Col 2</td>
                        </tr>
                        <tr>
                            <td>Row 2, Col 1</td>
                            <td>Row 2, Col 2</td>
                        </tr>
                    </tbody>
                </table>
                <p style="margin: 0; line-height: 1;">
                    Mid Merge Border (No Space After Table)
                </p>
            </div>
        </div>
        
        <!-- Image edge case tests covering aspect ratio safety, MIME validation, and error handling -->
        <div>
            <p>Testing aspect ratio safety with zero/invalid dimensions:</p>
            <img
                style="width: 100px; height: 0px;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Test image with zero height"
            />
            <img
                style="width: 0px; height: 100px;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Test image with zero width"
            />
            
            <p>Testing extreme aspect ratios:</p>
            <img
                style="width: 500px; height: 1px;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Very wide image"
            />
            <img
                style="width: 1px; height: 500px;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Very tall image"
            />
            
            <p>Testing auto dimensions with CSS styles:</p>
            <img
                style="width: auto; height: auto; font-family: serif;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Auto dimensions with non-dimensional styles"
            />
            
            <p>Testing images in figures (lineRule attribute fix):</p>
            <figure>
                <img
                    style="width: 150px;"
                    src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                    alt="Image in figure tag"
                />
                <figcaption>Image with consistent lineRule processing</figcaption>
            </figure>
            
            <p>Testing images with max-width/max-height constraints:</p>
            <img
                style="max-width: 200px; max-height: 150px;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Image with max constraints"
            />
            
            <p>Testing images exceeding maximum document width (auto-scaling):</p>
            <img
                style="width: 2000px; height: 1500px;"
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Oversized image that should auto-scale"
            />
        </div>
        <!-- Test case for GitHub issue #88: tables with colspan and rowspan attributes -->
        <table style="min-width: 100%;">
          <colgroup>
            <col style="min-width: 25px">
            <col style="min-width: 25px">
            <col style="min-width: 25px">
          </colgroup>
          <tbody>
            <tr>
              <th colspan="2" rowspan="1">
                <p>testset</p>
              </th>
              <th colspan="1" rowspan="1">
                <p>test</p>
              </th>
            </tr>
            <tr>
              <td colspan="1" rowspan="2">
                <p>data1</p>
              </td>
              <td colspan="1" rowspan="1">
                <p>data2</p>
              </td>
              <td colspan="1" rowspan="1">
                <p>data3</p>
              </td>
            </tr>
          </tbody>
        </table>
    </body>
</html>`;

(async () => {
  const fileBuffer = await HTMLtoDOCX(htmlString, null, {
    table: {
      row: { cantSplit: true },
      addSpacingAfter: true,
    },
    footer: true,
    pageNumber: true,
    preprocessing: { skipHTMLMinify: false },
  });

  fs.writeFile(filePath, fileBuffer, (error) => {
    if (error) {
      console.log('Docx file creation failed');
      return;
    }
    console.log('Docx file created successfully');
  });
})();

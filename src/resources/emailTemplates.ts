
export const mailConfirmationTemplate = (
    signToken: string,
): string => {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <!-- <link rel="icon" href="%PUBLIC_URL%/favicon.ico" /> -->
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <title>Email template</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300&display=swap" rel="stylesheet">
        <style>
            body {
                padding: 0;
                margin: 0;
                
                }
            h1   {color: blue;}
            .main {
                padding: 0;
                margin: 0;
                background-image:url('./img/emailverify_background.png');
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
                height: 100vh;
                text-align: center;
                display: flex;
                justify-content: center;
    
            }
            .card {
                width: 50%;
                height: 90%;
                background-color: #ffffff;
                position: absolute;
                /* padding-top: 3rem; */
                padding-left: 6rem;
                flex-direction: column;
                top: 2em;
                bottom: 0;
                display: flex;
                justify-content: center;
                border-radius: 1%;
            }
            .headerText {
               display: flex;
               flex-direction: row;
               justify-content: flex-start;
               text-align: left;
               margin-top: -6em;
               /* padding: 3em; */
            }
            .headerText1 {
                color: #DA4453;  
                font-size: 1.5em;
                font-family: Arimo;
                text-align: center;
                font-weight: bolder;
            }
            .headerText2 {
                color: #3E3E3E;
                font-size: 1.5em;
                font-family: Arimo;
                text-align: center;
                font-weight: bolder;
            }
            .paragraph {
                display: contents;
                justify-content: left;
                align-items: flex-start;
                text-align: left;
                color: #3E3E3E;
                font-weight: 600;
                font-family: 'Poppins', sans-serif;
                font-size: 0.8rem;
                line-height: 1.9;
    
            }
            .buttonMain {
                display: flex;
                justify-content: left;
                align-items: flex-start;
                text-align: left;
                width: 15rem;
                height: 20;
                border-radius: 25%;
            }
            .redButton {
                background-color: #e25152;
                color: #ffffff;
                font-family: 'Poppins', sans-serif;
                border: none;
                border-radius: 37px;
                outline: none;
                letter-spacing: 2.5px;
                font-size: 15px;
                padding: 15px 40px;
                margin-bottom: 2em;
    
            }
            .redButton:hover{
                background-color:rgb(196, 51, 51);
            }
            .support{
                color: #DA4453;
            }
            .support:hover{
                color:rgb(196, 51, 51);
            }
            .link{
                color: #797979;
                text-align: left;
                align-items: flex-start;
                display: flex;
            }
            .paraText{
                margin-top: 2em;
                margin-bottom: 2em;
            }
            .bottomParaText{
                margin-top: 2em;
                margin-bottom: 3em;
            }
            .cardMain{
                margin-top: 80px;
            }
            </style>
      </head>
    
      <body>
    <div class="main">
       <div class="card">
           <div class="cardMain">
        <div class="headerText">
            <div class="headerText1">SCREEN</div>
            <div class="headerText2">APP</div>
        </div>
        <div class="paragraph">
           <p class="paraText">
            Hi, <br/>
            Thanks for signing up for Screenapp.io<br/>
            Click the button below to activate your account and complete the signup <br/>
            process.
           </p>
        </div>
    
    
    
        <div class="buttonMain">
            <button type="button" class="redButton">VERIFY NOW</button>
         </div>
    
    
    
        <div class="paragraph">
            <p>
                If the button above does not work, click this link to active your account
            </p>
         </div>
         <div class="paragraph">
            <a href="https://screenapp.io/verification-email/code/${signToken}(user)" class="link">https://screenapp.io/verification-email/code/${signToken}(user) </a>
         </div>
         <div class="paragraph">
            <p class="bottomParaText">
                Thanks, <br/>The Screenapp Team
            </p>
         </div>
    
         <div class="paragraph">
            <p>
                Need help? Contact our <a href="#" class="support"> support team</a>
            </p>
         </div>
         </div>
       </div>
    </div>
      </body>
      </html>
    
     
`;
};





export const passwordResetTemplate = (
    url: string,
    unsubscribe: string
): string => {
    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1" />
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <!--<![endif]-->
    <!--[if (gte mso 9)|(IE)]>
    <xml>
    <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <!--[if (gte mso 9)|(IE)]>
    <style type="text/css">
        body {width: 600px;margin: 0 auto;}
        table {border-collapse: collapse;}
        table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}
        img {-ms-interpolation-mode: bicubic;}
    </style>
    <![endif]-->

    <style type="text/css">
        body,
        p,
        div {
            font-family: arial;
            font-size: 14px;
        }

        body {
            color: #000000;
        }

        body a {
            color: #1188E6;
            text-decoration: none;
        }

        p {
            margin: 0;
            padding: 0;
        }

        table.wrapper {
            width: 100% !important;
            table-layout: fixed;
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: 100%;
            -moz-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        img.max-width {
            max-width: 100% !important;
        }

        .column.of-2 {
            width: 50%;
        }

        .column.of-3 {
            width: 33.333%;
        }

        .column.of-4 {
            width: 25%;
        }

        @media screen and (max-width:480px) {

            .preheader .rightColumnContent,
            .footer .rightColumnContent {
                text-align: left !important;
            }

            .preheader .rightColumnContent div,
            .preheader .rightColumnContent span,
            .footer .rightColumnContent div,
            .footer .rightColumnContent span {
                text-align: left !important;
            }

            .preheader .rightColumnContent,
            .preheader .leftColumnContent {
                font-size: 80% !important;
                padding: 5px 0;
            }

            table.wrapper-mobile {
                width: 100% !important;
                table-layout: fixed;
            }

            img.max-width {
                height: auto !important;
                max-width: 480px !important;
            }

            a.bulletproof-button {
                display: block !important;
                width: auto !important;
                font-size: 80%;
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            .columns {
                width: 100% !important;
            }

            .column {
                display: block !important;
                width: 100% !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
            }
        }
    </style>
    <!--user entered Head Start-->

    <!--End Head user entered-->
</head>

<body>
    <center class="wrapper" data-link-color="#1188E6"
        data-body-style="font-size: 14px; font-family: arial; color: #000000; background-color: #ffffff;">
        <div class="webkit">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#ffffff">
                <tr>
                    <td valign="top" bgcolor="#ffffff" width="100%">
                        <table width="100%" role="content-container" class="outer" align="center" cellpadding="0"
                            cellspacing="0" border="0">
                            <tr>
                                <td width="100%">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td>
                                                <!--[if mso]>
                            <center>
                            <table><tr><td width="600">
                            <![endif]-->
                                                <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                                    style="width: 100%; max-width:600px;" align="center">
                                                    <tr>
                                                        <td role="modules-container"
                                                            style="padding: 0px 0px 0px 0px; color: #000000; text-align: left;"
                                                            bgcolor="#ffffff" width="100%" align="left">

                                                            <table class="module preheader preheader-hide" role="module"
                                                                data-type="preheader" border="0" cellpadding="0"
                                                                cellspacing="0" width="100%"
                                                                style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
                                                                <tr>
                                                                    <td role="module-content">
                                                                        <p></p>
                                                                    </td>
                                                                </tr>
                                                            </table>

                                                            <table class="module" role="module" data-type="text"
                                                                border="0" cellpadding="0" cellspacing="0" width="100%"
                                                                style="table-layout: fixed;">
                                                                <tr>
                                                                    <td style="padding:18px 10px 18px 10px;line-height:22px;text-align:inherit;"
                                                                        height="100%" valign="top" bgcolor="">
                                                                        <div>You are receiving this email because you
                                                                            (or someone else) have requested the reset
                                                                            of the password for your account.</div>

                                                                        <div>&nbsp;</div>

                                                                        <div>Please click on the following link, or
                                                                            paste this into your browser to complete the
                                                                            process:</div>

                                                                        <div>&nbsp;</div>

                                                                        <div style="text-align: center;">
                                                                            ${url}
                                                                        </div>

                                                                        <div>&nbsp;</div>

                                                                        <div>If you did not request this, please ignore
                                                                            this email and your password will remain
                                                                            unchanged.</div>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                            <div data-role="module-unsubscribe"
                                                                class="module unsubscribe-css__unsubscribe___2CDlR"
                                                                role="module" data-type="unsubscribe"
                                                                style="color:#444444;font-size:12px;line-height:20px;padding:16px 16px 16px 16px;text-align:center">
                                                                <div class="Unsubscribe--addressLine">
                                                                    <p class="Unsubscribe--senderName"
                                                                        style="font-family:Arial,Helvetica, sans-serif;font-size:12px;line-height:20px">
                                                                        Node API Starter</p>
                                                                    <p
                                                                        style="font-family:Arial,Helvetica, sans-serif;font-size:12px;line-height:20px">
                                                                        <span
                                                                            class="Unsubscribe--senderAddress">[Sender_Address]</span>,
                                                                        <span
                                                                            class="Unsubscribe--senderCity">[Sender_City]</span>,
                                                                        <span
                                                                            class="Unsubscribe--senderState">[Sender_State]</span>
                                                                        <span
                                                                            class="Unsubscribe--senderZip">[Sender_Zip]</span>
                                                                    </p>
                                                                </div>
                                                                <p
                                                                    style="font-family:Arial,Helvetica, sans-serif;font-size:12px;line-height:20px">
                                                                    <a class="Unsubscribe--unsubscribeLink"
                                                                        href="${unsubscribe}">Unsubscribe</a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <!--[if mso]>
                            </td></tr></table>
                            </center>
                            <![endif]-->
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    </center>
</body>

</html>
`;
};



export const passwordChangedConfirmationTemplate = (
    unsubscribe: string
): string => {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1" />
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <!--<![endif]-->
    <!--[if (gte mso 9)|(IE)]>
    <xml>
    <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <!--[if (gte mso 9)|(IE)]>
    <style type="text/css">
        body {width: 600px;margin: 0 auto;}
        table {border-collapse: collapse;}
        table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}
        img {-ms-interpolation-mode: bicubic;}
    </style>
    <![endif]-->

    <style type="text/css">
        body,
        p,
        div {
            font-family: arial;
            font-size: 14px;
        }

        body {
            color: #000000;
        }

        body a {
            color: #1188E6;
            text-decoration: none;
        }

        p {
            margin: 0;
            padding: 0;
        }

        table.wrapper {
            width: 100% !important;
            table-layout: fixed;
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: 100%;
            -moz-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        img.max-width {
            max-width: 100% !important;
        }

        .column.of-2 {
            width: 50%;
        }

        .column.of-3 {
            width: 33.333%;
        }

        .column.of-4 {
            width: 25%;
        }

        @media screen and (max-width:480px) {

            .preheader .rightColumnContent,
            .footer .rightColumnContent {
                text-align: left !important;
            }

            .preheader .rightColumnContent div,
            .preheader .rightColumnContent span,
            .footer .rightColumnContent div,
            .footer .rightColumnContent span {
                text-align: left !important;
            }

            .preheader .rightColumnContent,
            .preheader .leftColumnContent {
                font-size: 80% !important;
                padding: 5px 0;
            }

            table.wrapper-mobile {
                width: 100% !important;
                table-layout: fixed;
            }

            img.max-width {
                height: auto !important;
                max-width: 480px !important;
            }

            a.bulletproof-button {
                display: block !important;
                width: auto !important;
                font-size: 80%;
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            .columns {
                width: 100% !important;
            }

            .column {
                display: block !important;
                width: 100% !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
            }
        }
    </style>
    <!--user entered Head Start-->

    <!--End Head user entered-->
</head>

<body>
    <center class="wrapper" data-link-color="#1188E6"
        data-body-style="font-size: 14px; font-family: arial; color: #000000; background-color: #ffffff;">
        <div class="webkit">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#ffffff">
                <tr>
                    <td valign="top" bgcolor="#ffffff" width="100%">
                        <table width="100%" role="content-container" class="outer" align="center" cellpadding="0"
                            cellspacing="0" border="0">
                            <tr>
                                <td width="100%">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td>
                                                <!--[if mso]>
                            <center>
                            <table><tr><td width="600">
                            <![endif]-->
                                                <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                                    style="width: 100%; max-width:600px;" align="center">
                                                    <tr>
                                                        <td role="modules-container"
                                                            style="padding: 0px 0px 0px 0px; color: #000000; text-align: left;"
                                                            bgcolor="#ffffff" width="100%" align="left">

                                                            <table class="module preheader preheader-hide" role="module"
                                                                data-type="preheader" border="0" cellpadding="0"
                                                                cellspacing="0" width="100%"
                                                                style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
                                                                <tr>
                                                                    <td role="module-content">
                                                                        <p></p>
                                                                    </td>
                                                                </tr>
                                                            </table>

                                                            <table class="module" role="module" data-type="text"
                                                                border="0" cellpadding="0" cellspacing="0" width="100%"
                                                                style="table-layout: fixed;">
                                                                <tr>
                                                                    <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;"
                                                                        height="100%" valign="top" bgcolor="">
                                                                        <div style="text-align: center;">&nbsp;</div>

                                                                        <div style="text-align: center;">Password
                                                                            successfully changed.</div>

                                                                        <div style="text-align: center;">&nbsp;</div>

                                                                    </td>
                                                                </tr>
                                                            </table>
                                                            <div data-role="module-unsubscribe"
                                                                class="module unsubscribe-css__unsubscribe___2CDlR"
                                                                role="module" data-type="unsubscribe"
                                                                style="color:#444444;font-size:12px;line-height:20px;padding:16px 16px 16px 16px;text-align:center">
                                                                <div class="Unsubscribe--addressLine">
                                                                    <p class="Unsubscribe--senderName"
                                                                        style="font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:20px">
                                                                        Node API Starter</p>
                                                                    <p
                                                                        style="font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:20px">
                                                                        <span
                                                                            class="Unsubscribe--senderAddress">[Sender_Address]</span>,
                                                                        <span
                                                                            class="Unsubscribe--senderCity">[Sender_City]</span>,
                                                                        <span
                                                                            class="Unsubscribe--senderState">[Sender_State]</span>
                                                                        <span
                                                                            class="Unsubscribe--senderZip">[Sender_Zip]</span>
                                                                    </p>
                                                                </div>
                                                                <p
                                                                    style="font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:20px">
                                                                    <a class="Unsubscribe--unsubscribeLink"
                                                                        href="${unsubscribe}">Unsubscribe</a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <!--[if mso]>
                            </td></tr></table>
                            </center>
                            <![endif]-->
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    </center>
</body>

</html>`;
};

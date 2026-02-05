const axios = require('axios');
const cheerio = require('cheerio');

async function testFetch() {
    try {
        const url = 'https://www.bing.com/search?q=1+usd+to+ves';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // Bing usually puts the main calculation in a specific input or div
        // Trying to find the value in the input field often id="cc_ios_val" or similar for currency converter
        // Or looking for the big text.

        // Common selector for Bing calculator result
        // It often appears in a div with id="currency_converter_result" or similar, OR inside "b_focusText" class

        // Let's print some likely candidates
        const inputVal = $('#aa_to').val(); // Sometimes in input
        const bigText = $('.b_focusText').text();
        const conversionText = $('div[data-exchange-rate]').attr('data-exchange-rate'); // Hypothetical

        console.log('Input Val:', inputVal);
        console.log('Big Text:', bigText);

        // Sometimes it's just in the first text of a specific class
        const rateText = $('.b_focusText').first().text();
        console.log('Rate Text:', rateText);

        // Try to dump some text to see where the value is
        // console.log(response.data.substring(0, 5000));

    } catch (error) {
        console.error(error);
    }
}

testFetch();

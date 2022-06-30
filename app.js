const express = require("express");
const crypto = require("crypto");
const app = express();
const port = process.env.port || 3000;

let apiRouter = express.Router();
let v1 = require(`./api/v1`);
let v2 = require(`./api/v2`);
const { cpSync } = require("fs");
const { stringify } = require("querystring");

apiRouter.get("/", (req, res)=>{
    res.send("main page of api");
});

// apiRouter.param("version", (req, res, next, name)=>{
//     // here you can validate the input and update it accordingly
//     console.log(name);
//     req.params.version = "ok";
//     //next();
// }); pretty useless as u can just validate parameter in the get 

// apiRouter.get("/:version/:command", (req, res)=>{
//     let version = req.params.version;
//     let command = req.params.command;

    

//     // switch(version){
//     //     case "v1":
//     //         v1(command);
//     //         break;
//     //     case "v2":
//     //         v[1](command);
//     //         break;
//     // }

//     res.send(version);
// });

const puppeteer = require('puppeteer');

async function AmazonProductDetails(link) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link);
    await page.waitForSelector("#productTitle");
    let element = await page.$("#productTitle");
    let title = (await page.evaluate(el => el.textContent, element)).trim();
  
    console.log(title);
  
    /*
      to-do:
          discounts
    */
  
    //let priceData = JSON.parse(await page.evaluate(() => document.getElementsByClassName("twister-plus-buying-options-price-data")[0].innerHTML))[0];
    //let price = priceData.displayPrice;
    //console.log(price);
  
    let price = await page.evaluate(() => document.querySelector(".a-price .a-offscreen").textContent)
    console.log(price);
  
    //let ratingElement = await page.evaluate(() => document.querySelector(".a-icon-star span"))
    await page.waitForSelector("#averageCustomerReviews_feature_div");
    let reviewElement = await page.$("#averageCustomerReviews_feature_div");
    let ratingElement = await page.evaluate(el => el.querySelector(".a-icon-alt"), reviewElement);
    
    let rating = "Ratings Unavailable";
    let numOfRatings = "0";
  
    if (ratingElement) {
      rating = await page.evaluate(el => el.querySelector(".a-icon-alt").textContent, reviewElement);
      numOfRatings = await page.evaluate(el => el.querySelector("#acrCustomerReviewText").textContent, reviewElement);
  
      //await page.waitForSelector("#acrCustomerReviewText");
      //let numOfRatingsElement = await page.$("#acrCustomerReviewText");
      //numOfRatings = await page.evaluate(el => el.textContent, numOfRatingsElement);
    }
  
    console.log(rating);
    console.log(numOfRatings);
    
    await page.waitForSelector("#imageBlock");
    let imageBlock = await page.$("#imageBlock");
    let landingImageSrc = await page.evaluate(el => el.querySelector(".a-dynamic-image").src, imageBlock);
    console.log(landingImageSrc);
  
    let optionListData = [];
  
    //await page.waitForSelector("#twister");
    let optionTwister = await page.$("#twister");
    if (optionTwister) {
      let twisterMethod = await page.evaluate(el => el.method, optionTwister)
      if (twisterMethod) { // check if there are any variations
  
          optionListData = await page.evaluate(el => {
            let data = []; // contains info about each div
            let divs = el.querySelectorAll(".a-section");
  
            for (div of divs){
              let option = {};
              option["type"] = div.querySelector(".a-row .a-form-label").textContent.trim().replace(":", "");
              option["current"] = div.querySelector(".a-row .selection").textContent;
              option["options"] = [];
  
              let listItems = div.querySelectorAll("ul li");
              for (listItem of listItems){
                let optionData = {};
                
                let button = listItem.querySelector(".a-button-text");
  
                let titleElement = button.querySelector(".twisterTextDiv p");
                if (titleElement){
                  optionData["title"] = titleElement.textContent.trim();
                }
                
                let priceElement = button.querySelector(".twisterSlotDiv span p");
                if (priceElement){
                  optionData["price"] = priceElement.textContent.trim();
                }
                
                let imgElement = button.querySelector("img");
                if (imgElement){
                  optionData["src"] = imgElement.src;
                  optionData["alt"] = imgElement.alt;
                }
  
                option["options"].push(optionData);
              }
  
              data.push(option);
            }
  
            return data;
          }, optionTwister);
          
          for (i of optionListData){
            console.log(i);
          }
      }
    }
  
    await page.waitForSelector("#productOverview_feature_div");
    let productOverviewElement = await page.$("#productOverview_feature_div");
    let overviewTbody = await page.evaluate(el => el.querySelector("tbody"), productOverviewElement);
    
    let productOverviewDetails = {}
    if (overviewTbody){
      productOverviewDetails = await page.evaluate(el => {
        let data = {};
        let tds = el.querySelector("tbody").querySelectorAll("td");
        
        for (let i = 0; i < tds.length; i++){
          data[tds[i].querySelector("span").textContent] = tds[i++ + 1].querySelector("span").textContent;
        }
        return data;
      }, productOverviewElement);
    }
  
    for ([key, value] of Object.entries(productOverviewDetails)){
      console.log(`${key} = ${value}`);
    }
  
    //const attr = await page.evaluate(el => getComputedStyle(el, "#price").getPropertyValue("color"), priceElement);
    //const rgb2hex = (rgb) => `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`
    //console.log(rgb2hex(attr));
  
    await page.waitForSelector("#availability");
    let availabilityElement = await page.$("#availability span")
    
    let stockStatus = (await page.evaluate(el => el.textContent, availabilityElement)).trim();
    const stockStatusColor = await page.evaluate(el => getComputedStyle(el).getPropertyValue("color"), availabilityElement);
    
    console.log(stockStatus);
    
    await browser.close();
    const data = {status: "ok", stockStatus: stockStatus, stockStatusColor: stockStatusColor, price: price, name: title, options: optionListData, productDetails: Object.entries(productOverviewDetails), landingImg: landingImageSrc};
    return await data;
  }


v1.addFunction("json2object", (args) => {
    var obj = eval(`(${args.json})`);
    return obj;
});

v1.addFunction("obfuscateIds", (args) => {
    const generateRandomID = (length) => (Math.random() + 1).toString(36).substring(length);
    var html = args.html;
    
    var usedIds = {};
    return html.replaceAll("id123", crypto.randomUUID());
});

v1.addFunction("getAmazonProductDetails", async (args) => {
    var link = args.link;

    var details = await AmazonProductDetails(link);
    var jsonDetails = JSON.stringify(details);

    return jsonDetails;
});

apiRouter.get("/v1/:command", v1.handleCommand);

app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.use("/api", apiRouter)

app.listen(port, () => {
    console.log(`now listening to port ${port}`)
});
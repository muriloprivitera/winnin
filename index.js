const request = require('./service/http');
const connect_bd = require('./service/connection');
const config = require('./config.json');
const express = require('express');
const moment = require('moment');   
const CronJob = require('cron').CronJob;
 
const app = express(); 

const get_data = async () => {
    connect_bd.connect(async (err) => { 
        if(!err){
            console.log("[Service Reddit] Running services ...");
        }
        else {
            console.log(err);
        }
    });

    let result = await request.get('/');
    let status = result.status;
    if(status && status === 200){

        let data = result.data.data.children;

        for (const child of data) {
            let obj = child.data;
            await upsert(obj);
        }
    }
}

const upsert = async (reddit_data) => {

    let timestamp = reddit_data.created;
    let date = moment(timestamp * 1000).format("YYYY-MM-DD");
    let query = `
        SELECT 
            id 
        FROM pim.reddit_winnin 
        WHERE author_name = "${reddit_data.author}" 
            AND title = "${reddit_data.title}" 
            AND create_date = "${date}"
    `;
    
    connect_bd.query(query, async (err, results) => {
        if(!err){
            if(results[0]){
                await update(reddit_data, results[0].id, date);
                return;
            }
            else {
                await insert(reddit_data, date);
                return;
            }
        }
    }).on('error', function(err) {
        console.log("[mysql error]",err);
    });
}

const insert = async (reddit_data, date) => {
    const bdname = config['DATABASE'];
    
    let query = `
        INSERT INTO ${bdname}.reddit_winnin 
            (
                author_name, 
                title, 
                create_date, 
                ups
            )
        VALUES (
            "${reddit_data.author}", 
            "${reddit_data.title}", 
            "${date}", 
             ${reddit_data.ups}
                );
    `;

    await execute_query(query);
    return;
}

const update = async (reddit_data, id, date) => {
    const bdname = config['DATABASE'];

    let query = `
        UPDATE ${bdname}.reddit_winnin 
        SET 
            author_name     = "${reddit_data.author}", 
            title           = "${reddit_data.title}", 
            create_date     = "${date}", 
            ups             =  ${reddit_data.ups}
        WHERE id = ${id}
    `;
    await execute_query(query);
    return;
}

const execute_query = async (query) => {
    connect_bd.query(query);
}

get_data();

var schedule = new CronJob('0 0 0 * * *', function() {
    //will run every day at 12:00 AM
    get_data();
});

schedule.start();



app.get('/range-date/:startDate/:endDate/:order', async (req, res) => {
    
    let start_date = moment(req.params.startDate).format("YYYY-MM-DD");
    let end_date = moment(req.params.endDate).format("YYYY-MM-DD");;
    let order = req.params.order;
    let response = [];

    let generic_query = `SELECT * FROM pim.reddit_winnin WHERE create_date >= "${start_date}" AND create_date <= "${end_date}" ORDER BY ups ${order}`;

    connect_bd.query(generic_query, async (err, results) => {
        if(!err){
            for (const obj of results) {
                let data = {
                    author: obj.author_name,
                    title: obj.title,
                    create_date: obj.create_date,
                    ups: obj.ups
                }
                response.push(data);
            }
        }
        res.send(response);
    });
});

app.get('/:order', async (req, res) => {
    let order = req.params.order;
    let response = [];

    let generic_query = `SELECT * FROM pim.reddit_winnin ORDER BY ups ${order}`;
    connect_bd.query(generic_query, async (err, results) => {
        if(!err){
            for (const obj of results) {
                let data = {
                    author: obj.author_name,
                    title: obj.title,
                    create_date: obj.create_date,
                    ups: obj.ups
                }
                response.push(data);
            }
        }
        res.send(response);
    });
});

app.listen(3000);

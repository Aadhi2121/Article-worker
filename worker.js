require('dotenv').config();

const fs = require('fs');
const path = require('path');
const amqp = require('amqplib');
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'articles_db';
const COLLECTION = 'articles';
const DATA_FOLDER = './data';
const QUEUE = 'article_queue';

const ALLOWED_TYPES = process.env.ALLOWED_TYPES
  ? process.env.ALLOWED_TYPES.split(',').map(t => t.trim().toLowerCase())
  : [];

async function startWorker() {
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const db = mongoClient.db(DB_NAME);
  const collection = db.collection(COLLECTION);

  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  console.log('Worker started. Waiting for messages');

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    const articleId = msg.content.toString();
    const filePath = path.join(DATA_FOLDER, `${articleId}.json`);

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const articleData = parsed.articles?.[0];

      if (!articleData) {
        console.log(`No article content found for ID: ${articleId}`);
        channel.ack(msg);
        return;
      }

      const type = (articleData.type || '').toLowerCase();

      if (!ALLOWED_TYPES.includes(type)) {
        console.log(`Skipped article ${articleId} due to disallowed type: ${type}`);
        channel.ack(msg);
        return;
      }

      await collection.insertOne({
        articleId,
        data: articleData,
        insertedAt: new Date()
      });

      console.log(`Inserted article ${articleId} into MongoDB`);
      channel.ack(msg);
    } catch (err) {
      console.error(`Error processing article ${articleId}: ${err.message}`);
      channel.ack(msg);
    }
  }, { noAck: false });
}

startWorker().catch(console.error);

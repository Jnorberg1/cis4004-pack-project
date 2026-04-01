import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import {
  User,
  Shirt,
  Pack,
  CollectionEntry,
  Category,
  Rarity,
  PackOpeningHistory,
  Trade,
} from "./models/index.js";

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    await PackOpeningHistory.deleteMany({});
    await Trade.deleteMany({});
    await CollectionEntry.deleteMany({});
    await Pack.deleteMany({});
    await Shirt.deleteMany({});
    await Category.deleteMany({});
    await Rarity.deleteMany({});
    await User.deleteMany({});

    const rarities = await Rarity.insertMany([
      { name: "Common", weight: 60 },
      { name: "Rare", weight: 25 },
      { name: "Epic", weight: 10 },
      { name: "Legendary", weight: 5 },
    ]);

    const categories = await Category.insertMany([
      { name: "Anime" },
      { name: "Streetwear" },
      { name: "Vintage" },
      { name: "Gaming" },
      { name: "Music" },
      { name: "Horror" },
    ]);

    const rarityMap = Object.fromEntries(
      rarities.map((rarity) => [rarity.name, rarity._id])
    );

    const categoryMap = Object.fromEntries(
      categories.map((category) => [category.name, category._id])
    );

    const shirts = await Shirt.insertMany([
      {
        name: "Akira Neon Tee",
        brand: "PackThreads",
        description: "Bright cyber anime graphic shirt.",
        rarity: rarityMap["Common"],
        categories: [categoryMap["Anime"], categoryMap["Streetwear"]],
        valueScore: 15,
      },
      {
        name: "Pixel Raider Tee",
        brand: "LootLayer",
        description: "Retro gaming inspired pixel shirt.",
        rarity: rarityMap["Common"],
        categories: [categoryMap["Gaming"]],
        valueScore: 12,
      },
      {
        name: "Midnight Slasher Tee",
        brand: "NightDrop",
        description: "Classic horror poster style shirt.",
        rarity: rarityMap["Rare"],
        categories: [categoryMap["Horror"], categoryMap["Vintage"]],
        valueScore: 28,
      },
      {
        name: "Analog Noise Tee",
        brand: "Static Supply",
        description: "Washed vintage music festival design.",
        rarity: rarityMap["Rare"],
        categories: [categoryMap["Music"], categoryMap["Vintage"]],
        valueScore: 25,
      },
      {
        name: "Dragon Storm Tee",
        brand: "Mythic Ink",
        description: "High-detail fantasy anime dragon shirt.",
        rarity: rarityMap["Epic"],
        categories: [categoryMap["Anime"]],
        valueScore: 45,
      },
      {
        name: "Arcade Overdrive Tee",
        brand: "LootLayer",
        description: "Bold arcade cabinet graphic with neon style.",
        rarity: rarityMap["Epic"],
        categories: [categoryMap["Gaming"], categoryMap["Streetwear"]],
        valueScore: 48,
      },
      {
        name: "Phantom Tour Tee",
        brand: "Static Supply",
        description: "Ultra rare dark concert bootleg design.",
        rarity: rarityMap["Legendary"],
        categories: [categoryMap["Music"], categoryMap["Streetwear"]],
        valueScore: 90,
      },
      {
        name: "Blood Moon Tee",
        brand: "NightDrop",
        description: "Legendary horror moon phase collector shirt.",
        rarity: rarityMap["Legendary"],
        categories: [categoryMap["Horror"]],
        valueScore: 95,
      },
    ]);

    const starterPack = await Pack.create({
      name: "Starter Drip Pack",
      description: "A starter pack with mixed graphic shirt drops.",
      shirtPool: shirts.map((shirt) => shirt._id),
      cardsPerPack: 3,
    });

    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    const hashedUserPassword = await bcrypt.hash("user123", 10);

    const adminUser = await User.create({
      username: "admin",
      password: hashedAdminPassword,
      role: "admin",
    });

    const demoUser = await User.create({
      username: "demo",
      password: hashedUserPassword,
      role: "user",
    });

    console.log("Seed complete");
    console.log("Admin login: admin / admin123");
    console.log("Demo login: demo / user123");
    console.log(`Created ${rarities.length} rarities`);
    console.log(`Created ${categories.length} categories`);
    console.log(`Created ${shirts.length} shirts`);
    console.log(`Created 1 pack: ${starterPack.name}`);
    console.log(`Created users: ${adminUser.username}, ${demoUser.username}`);

    process.exit();
  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
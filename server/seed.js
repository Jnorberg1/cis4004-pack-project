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
      { name: "Comics" },
      { name: "Movies & TV" },
      { name: "Music" },
      { name: "Gaming" },
      { name: "Sports" },
      { name: "Collegiate" },
      { name: "Streetwear" },
      { name: "Vintage" },
      { name: "Art" },
      { name: "Horror" },
      { name: "Travel" },
    ]);

    const rarityMap = Object.fromEntries(
      rarities.map((rarity) => [rarity.name, rarity._id])
    );

    const categoryMap = Object.fromEntries(
      categories.map((category) => [category.name, category._id])
    );

    // Shirt art sourced from Imgur album "T-Shirt Project":
    // https://imgur.com/a/aniTz4t
    const shirts = await Shirt.insertMany([
      {
        name: "Batman Shirt",
        brand: "T-Shirt Project",
        description: "DC Comics caped crusader graphic tee.",
        image: "https://i.imgur.com/inqHdxo.jpeg",
        rarity: rarityMap["Common"],
        categories: [categoryMap["Comics"], categoryMap["Streetwear"]],
        valueScore: 32,
      },
      {
        name: "Bjork Shirt",
        brand: "T-Shirt Project",
        description: "Iconic Icelandic artist tour-style graphic.",
        image: "https://i.imgur.com/7l07Fky.jpeg",
        rarity: rarityMap["Rare"],
        categories: [categoryMap["Music"]],
        valueScore: 41,
      },
      {
        name: "Bob Dylan Shirt",
        brand: "T-Shirt Project",
        description: "Classic folk-rock legend portrait tee.",
        image: "https://i.imgur.com/XZw93ft.jpeg",
        rarity: rarityMap["Rare"],
        categories: [categoryMap["Music"], categoryMap["Vintage"]],
        valueScore: 43,
      },
      {
        name: "David Bowie Shirt",
        brand: "T-Shirt Project",
        description: "Ziggy-era glam rock graphic shirt.",
        image: "https://i.imgur.com/Aq7r6AX.jpeg",
        rarity: rarityMap["Epic"],
        categories: [categoryMap["Music"], categoryMap["Vintage"]],
        valueScore: 56,
      },
      {
        name: "Hawaii Shirt",
        brand: "T-Shirt Project",
        description: "Tropical island vacation print tee.",
        image: "https://i.imgur.com/jGrkEsy.jpeg",
        rarity: rarityMap["Common"],
        categories: [categoryMap["Travel"], categoryMap["Vintage"]],
        valueScore: 22,
      },
      {
        name: "Jaws Shirt",
        brand: "T-Shirt Project",
        description: "Amity horror classic shark movie tee.",
        image: "https://i.imgur.com/lS5T0uz.jpeg",
        rarity: rarityMap["Rare"],
        categories: [categoryMap["Movies & TV"], categoryMap["Horror"]],
        valueScore: 39,
      },
      {
        name: "M.C. Escher Shirt",
        brand: "T-Shirt Project",
        description: "Impossible geometry and optical art print.",
        image: "https://i.imgur.com/zp2OgDG.jpeg",
        rarity: rarityMap["Epic"],
        categories: [categoryMap["Art"]],
        valueScore: 51,
      },
      {
        name: "Nike Shirt",
        brand: "Nike",
        description: "Swoosh athletic brand graphic tee.",
        image: "https://i.imgur.com/6pmqaxE.jpeg",
        rarity: rarityMap["Common"],
        categories: [categoryMap["Sports"], categoryMap["Streetwear"]],
        valueScore: 30,
      },
      {
        name: "Nirvana Shirt",
        brand: "T-Shirt Project",
        description: "90s grunge Seattle band smiley motif.",
        image: "https://i.imgur.com/qK1XKug.jpeg",
        rarity: rarityMap["Legendary"],
        categories: [categoryMap["Music"]],
        valueScore: 86,
      },
      {
        name: "Pink Floyd Shirt",
        brand: "T-Shirt Project",
        description: "Prog rock prism and psychedelic artwork.",
        image: "https://i.imgur.com/2v4wX4t.jpeg",
        rarity: rarityMap["Epic"],
        categories: [categoryMap["Music"], categoryMap["Vintage"]],
        valueScore: 59,
      },
      {
        name: "Skiing Shirt",
        brand: "T-Shirt Project",
        description: "Winter slopes and alpine sports graphic.",
        image: "https://i.imgur.com/MkbahVJ.jpeg",
        rarity: rarityMap["Common"],
        categories: [categoryMap["Sports"], categoryMap["Vintage"]],
        valueScore: 19,
      },
      {
        name: "Sonic Youth Shirt",
        brand: "T-Shirt Project",
        description: "NY noise-rock band daydream nation era feel.",
        image: "https://i.imgur.com/9EtyGD7.jpeg",
        rarity: rarityMap["Rare"],
        categories: [categoryMap["Music"]],
        valueScore: 45,
      },
      {
        name: "Spider Man Shirt",
        brand: "T-Shirt Project",
        description: "Marvel wall-crawler webhead tee.",
        image: "https://i.imgur.com/kNfQylI.jpeg",
        rarity: rarityMap["Rare"],
        categories: [categoryMap["Comics"]],
        valueScore: 37,
      },
      {
        name: "Star Wars Return of the Jedi Shirt",
        brand: "T-Shirt Project",
        description: "Galaxy far away Episode VI style art.",
        image: "https://i.imgur.com/H5sct3o.jpeg",
        rarity: rarityMap["Legendary"],
        categories: [categoryMap["Movies & TV"], categoryMap["Vintage"]],
        valueScore: 89,
      },
      {
        name: "The Smiths Shirt",
        brand: "T-Shirt Project",
        description: "Manchester indie legends Morrissey-era graphic.",
        image: "https://i.imgur.com/NEjlNVz.jpeg",
        rarity: rarityMap["Epic"],
        categories: [categoryMap["Music"]],
        valueScore: 53,
      },
      {
        name: "TMNT Shirt",
        brand: "T-Shirt Project",
        description: "Heroes in a half shell pizza squad tee.",
        image: "https://i.imgur.com/GI6wDvf.jpeg",
        rarity: rarityMap["Rare"],
        categories: [categoryMap["Comics"]],
        valueScore: 41,
      },
      {
        name: "UCF Spirit Splash Shirt",
        brand: "UCF",
        description: "University of Central Florida spirit splash design.",
        image: "https://i.imgur.com/xdE8aDt.jpeg",
        rarity: rarityMap["Epic"],
        categories: [categoryMap["Collegiate"], categoryMap["Sports"]],
        valueScore: 47,
      },
      {
        name: "Akira Shirt",
        brand: "T-Shirt Project",
        description: "Neo-Tokyo cyberpunk motorcycle classic.",
        image: "https://i.imgur.com/YwGmdFM.jpeg",
        rarity: rarityMap["Epic"],
        categories: [categoryMap["Anime"], categoryMap["Streetwear"]],
        valueScore: 63,
      },
      {
        name: "PacMan Shirt",
        brand: "T-Shirt Project",
        description: "Arcade maze chaser pixel legend tee.",
        image: "https://i.imgur.com/yToWxzO.jpeg",
        rarity: rarityMap["Common"],
        categories: [categoryMap["Gaming"], categoryMap["Vintage"]],
        valueScore: 31,
      },
    ]);

    const starterPack = await Pack.create({
      name: "Starter Drip Pack",
      description:
        "Graphic tees from the T-Shirt Project Imgur set—mixed drops every open.",
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
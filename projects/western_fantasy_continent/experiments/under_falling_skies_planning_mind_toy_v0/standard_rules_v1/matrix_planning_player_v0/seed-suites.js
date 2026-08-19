"use strict";

const {SeededRng}=require("../standard-engine");
function makeSeeds(master,count){const rng=new SeededRng(master);return Array.from({length:count},()=>((Math.floor(rng.next()*0xffffffff)>>>0)||1));}
module.exports={train:makeSeeds(0xA11CE,60),dev:makeSeeds(0xD3A1,60),final:makeSeeds(0xF20E,100),smoke:makeSeeds(0x51A7E,8)};

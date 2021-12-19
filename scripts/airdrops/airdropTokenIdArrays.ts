import { concatTotal } from "./rfSzn2participation";

export const kinship = [
  7765, 8396, 7422, 7848, 1743, 1998, 8557, 4441, 4350, 8095, 3541, 8121, 6912,
  4557, 5935, 1836, 1014, 7653, 1840, 1838, 8612, 1876, 4567, 6615, 4564, 4561,
  6350, 9175, 7247, 1083, 3932, 4301, 4302, 9634, 4566, 9636, 6342, 8256, 4682,
  6052, 8205, 8583, 1668, 9819, 9818, 9815, 9816, 4679, 4677, 4680, 4681, 4683,
  4684, 3169, 6447, 3933, 3749, 2962, 7480, 9822, 7772, 8837, 9817, 4982, 3205,
  4983, 662, 7030, 7384, 820, 2270, 1584, 9685, 8554, 673, 8863, 4090, 8061,
  5702, 1547, 4640, 1483, 3736, 4232, 4650, 7196, 3938, 1207, 5146, 3371, 6375,
  3939, 37, 6880, 3820, 5372, 600, 8383, 3124, 7585,
];

export const rarity = [
  19095, 5535, 8845, 12518, 13700, 7001, 11267, 7848, 6887, 4285, 23481, 1549,
  18411, 14341, 21424, 3052, 8585, 9369, 2057, 5934, 15243, 3724, 19172, 15560,
  23881, 474, 1627, 9027, 11866, 826, 15571, 6335, 5205, 13536, 8062, 12409,
  24974, 8121, 14489, 24410, 22197, 172, 20308, 14117, 1812, 23711, 4350, 5109,
  9398, 3541, 9358, 1743, 16411, 4616, 6932, 15246, 4820, 22720, 8809, 24256,
  22133, 11519, 12686, 21508, 1454, 7422, 2165, 8623, 3295, 2270, 13262, 8609,
  4441, 3585, 2195, 16503, 8921, 13998, 9373, 18650, 4518, 7068, 24509, 1565,
  1293, 22470, 7403, 572, 23921, 3168, 3267, 4589, 14454, 22864, 266, 13241,
  3408, 9459, 16710, 3299,
];

export const rookKin = [
  19459, 15228, 16813, 16969, 15026, 12893, 13536, 19288, 21337, 20546, 15120,
  15479, 15629, 19312, 14173, 11428, 11290, 18681, 16728, 17025, 12482, 13172,
  17344, 15013, 10561, 17188, 15327, 18107, 13238, 15434, 19406, 14510, 19207,
  20342, 19903, 18438, 13523, 16059, 21038, 14697, 12387, 20294, 15707, 12513,
  19788, 14098, 16936, 16272, 20108, 14155, 14265, 13481, 12098, 21938, 16889,
  10425, 18028, 13218, 19210, 13082, 12422, 14457, 19486, 12123, 17901, 21960,
  19735, 18162, 13170, 14019, 21809, 18995, 12973, 13115, 12206, 19837, 19388,
  16915, 11033, 15320, 16246, 11607, 12656, 18145, 17813, 21934, 11902, 16594,
  17298, 13343, 18495, 16642, 16078, 13412, 20753, 12873, 15676, 12689, 15246,
  21114,
];

export const rookXP = [
  14117, 19952, 13700, 12780, 24976, 22197, 19172, 15571, 19095, 23174, 24975,
  18442, 19937, 13996, 12481, 17033, 23974, 14557, 13536, 24410, 14296, 23881,
  14341, 14173, 12247, 19373, 21895, 17025, 14935, 17265, 14194, 11526, 18411,
  22473, 11519, 22078, 16307, 21678, 20641, 13172, 16420, 16202, 15560, 17344,
  15120, 12893, 15629, 15013, 20717, 19055, 13661, 20299, 21508, 10090, 10095,
  13839, 18051, 12770, 11430, 11875, 18750, 22827, 22246, 24130, 12278, 21561,
  10561, 16216, 10951, 13364, 19548, 21349, 17342, 11325, 18539, 16354, 15163,
  17282, 14256, 19834, 16748, 21921, 16076, 16095, 16959, 12986, 12400, 16239,
  15841, 15147, 14649, 16861, 19178, 11207, 11834, 13136, 12458, 12223, 12031,
  20203,
];

export const xp = [
  8531, 6952, 5535, 14117, 19952, 4271, 5027, 8845, 1240, 383, 13700, 826, 3295,
  172, 12780, 9293, 2542, 24976, 3052, 4285, 22197, 7433, 19172, 1735, 15571,
  5540, 19095, 6534, 1583, 1745, 4436, 23174, 24975, 4589, 5205, 7969, 3848,
  9890, 3308, 5790, 305, 1728, 18442, 7617, 8050, 19937, 3513, 13996, 3, 6183,
  3974, 8585, 3169, 3425, 8216, 7885, 3899, 3898, 2270, 1779, 8082, 9673, 9948,
  8764, 4740, 7895, 6089, 1083, 4441, 5764, 7355, 1433, 6147, 12481, 3051, 1385,
  1381, 8499, 632, 2575, 1425, 1740, 9284, 8276, 3541, 17033, 23974, 8287, 574,
  4797, 9753, 9681, 3288, 3585, 9760, 14557, 1177, 8605, 3934, 6376,
];

export const topTenKinship = kinship.slice(3, 10); //ranks 4 to 10
export const top100Kinship = kinship.slice(10, 100); // ranks 10 to 100
export const topTenRarity = rarity.slice(3, 10);
export const top100Rarity = rarity.slice(10, 100);
export const topTenRookKin = rookKin.slice(3, 10);
export const top100RookKin = rookKin.slice(10, 100);
export const topTenRookXP = rookXP.slice(3, 10);
export const top100RookXP = rookXP.slice(10, 100);
export const topTenXP = xp.slice(3, 10);
export const top100XP = xp.slice(10, 100);

export const plaayerTotal = [...new Set(concatTotal)];
export const plaayerSet1 = plaayerTotal.slice(0, 1375);
export const plaayerSet2 = plaayerTotal.slice(1375, 2750);
export const plaayerSet3 = plaayerTotal.slice(2750, 4125);
export const plaayerSet4 = plaayerTotal.slice(4125, 5500);
export const plaayerSet5 = plaayerTotal.slice(5500, 6875);
export const plaayerSet6 = plaayerTotal.slice(6875, 8250);
export const plaayerSet7 = plaayerTotal.slice(8250, 9625);
export const plaayerSet8 = plaayerTotal.slice(9625, 10975);

console.log("Plaayer Total: ", plaayerTotal.length);
console.log(
  "Plaayersets total: ",
  plaayerSet1.length +
    plaayerSet2.length +
    plaayerSet3.length +
    plaayerSet4.length +
    plaayerSet5.length +
    plaayerSet6.length +
    plaayerSet7.length +
    plaayerSet8.length
);

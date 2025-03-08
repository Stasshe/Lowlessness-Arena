export type MapDefinition = {
  name: string;
  description: string;
  data: string[];
};

export const mapData: { [key: string]: MapDefinition } = {
  japan: {
    name: "Japan",
    description: "Traditional Japanese garden with cherry blossoms",
    data: [
      "wwwwwwwwwwwwwwwwww",
      "w________ww______w",
      "w_gggg____ww_gggg_w",
      "w_gggg________ggg_w",
      "w____www_____www__w",
      "w____www_____www__w",
      "w_ggg________gggg_w",
      "w_gggg__ww____ggg_w",
      "w______ww_________w",
      "wwwwwwwwwwwwwwwwww"
    ]
  },
  
  arena: {
    name: "Arena",
    description: "Symmetrical battle arena with obstacles",
    data: [
      "wwwwwwwwwwwwwwwwww",
      "w__________________w",
      "w__ww________ww___w",
      "w__ww________ww___w",
      "w_____wwwwww_____w",
      "w_____wwwwww_____w",
      "w__ww________ww___w",
      "w__ww________ww___w",
      "w__________________w",
      "wwwwwwwwwwwwwwwwww"
    ]
  },
  
  forest: {
    name: "Forest",
    description: "Dense forest with lots of hiding spots",
    data: [
      "wwwwwwwwwwwwwwwwww",
      "w_ggggg____ggggg__w",
      "w_ggggg____ggggg__w",
      "w______ww_________w",
      "w______ww_________w",
      "w______ww_________w",
      "w______ww_________w",
      "w_ggggg____ggggg__w",
      "w_ggggg____ggggg__w",
      "wwwwwwwwwwwwwwwwww"
    ]
  }
};

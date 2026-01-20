export const carDatabase = [
  {
    id: 1,
    brand: "Toyota",
    models: [
      {
        name: "Camry",
        years: ["2018-2023", "2024-2025"],
        products: [
          { 
            id: 101, 
            name: "شاشة أندرويد 10 إنش", 
            price: "250$", 
            type: "Screen",
            // رابط صورة أزرق مكتوب عليه Android Screen
            image: "https://placehold.co/600x400/1e40af/ffffff?text=Android+Screen" 
          },
          { 
            id: 102, 
            name: "كاميرا خلفية HD", 
            price: "45$", 
            type: "Camera",
            // رابط صورة أخضر
            image: "https://placehold.co/600x400/166534/ffffff?text=Rear+Camera"
          }
        ]
      },
      {
        name: "Corolla",
        years: ["2019-2022"],
        products: [
          { 
            id: 103, 
            name: "إطار ديكور مسجل", 
            price: "30$", 
            type: "Frame",
            image: "https://placehold.co/600x400/d97706/ffffff?text=Frame+Decor"
          }
        ]
      }
    ]
  },
  {
    id: 2,
    brand: "Nissan",
    models: [
      {
        name: "Sunny",
        years: ["2020-2024"],
        products: [
          { 
            id: 201, 
            name: "شاشة تسلا 12 إنش", 
            price: "300$", 
            type: "Screen",
            image: "https://placehold.co/600x400/991b1b/ffffff?text=Tesla+Style"
          },
          { 
            id: 202, 
            name: "حساسات اصطفاف", 
            price: "60$", 
            type: "Sensor",
            image: "https://placehold.co/600x400/374151/ffffff?text=Parking+Sensors"
          }
        ]
      },
      {
        name: "Patrol",
        years: ["2015-2020", "2021-2025"],
        products: [
          { 
            id: 203, 
            name: "شاشات خلفية (مسند رأس)", 
            price: "400$", 
            type: "Screen",
            image: "https://placehold.co/600x400/6b21a8/ffffff?text=Headrest+Monitors"
          }
        ]
      }
    ]
  }
];
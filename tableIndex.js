module.exports = [
    {
        name: 'city_storeName_category',
        fields: ['city', 'storeName', 'category']
    },
    {
        name: 'storeName_location_city_brand',
        fields: ['storeName', 'location', 'city', 'brand']
    },
    {
        name: 'category_brand_name_year_month_city',
        fields: ['category', 'brand', 'name', 'year', 'month', 'city']
    },
    {
        name: 'name',
        fields: ['name']
    },
    {
        name: 'year',
        fields: ['year']
    },
    {
        name: "groupName_groupCode_category_city_storeCode_store",
        fields: ["groupName", "groupCode", "category", "city", "storeCode", "store"]
    },
    {
        name: 'groupName_groupCode_category',
        fields: ["groupName", "groupCode", "category"]
    },
    {
        name: "groupName_groupCode_category_name_city_storeCode_store",
        fields: ["groupName", "groupCode", "category", "name", "city", "storeCode", "store"]
    }
]
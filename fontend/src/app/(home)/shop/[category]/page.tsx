import Shop from "@/components/shop/shop";

const ShopByCategory = async ({ params }: { params: Promise<{ category: string }> }) => {
    
 

    const categoryId = (await params).category;

    return <Shop initialCategoryId={categoryId} />
};

export default ShopByCategory;
import ProductCard from '@/components/common/product-card';
import { Product } from '@/types';
import React from 'react';

const RelatedProducts = ({ data }: { data: any[] }) => {

    if (!data || data.length === 0) {
        return null;
    }
    return (
        <div className='mt-2'>
            <h1 className='text-base md:text-xl font-medium mb-3 '>Related Products</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                {data?.map((product: Product) => (
                    <ProductCard
                        key={product._id}
                        product={product as any}
                    />
                ))}
            </div>
        </div>
    );
};

export default RelatedProducts;
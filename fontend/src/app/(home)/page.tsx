import HeroMain from '@/components/home/hero/HeroMain';
import HomeCategorySection from '@/components/home/sections/all-sub-category';
import ExploreProducts from '@/components/home/sections/explore-products';
import FeaturedProducts from '@/components/home/sections/featured-products';
import HeroCategories from '@/components/home/sections/hero-categories';
import HotDealsSection from '@/components/home/sections/hot-deals';
import SubcategorySectionByCollection from '@/components/home/sections/subcategory-collection-products';
import UserFeedback from '@/components/home/sections/user-feedback';
import React from 'react';


const HomePageMain = async () => {



  return (
    <div >
      <HeroCategories />
      <HeroMain />
      <HomeCategorySection />
      <HotDealsSection />
      {/* <FeaturedProducts /> */}
      {/* <CategoriesSection /> */}
      {/* <ExploreProducts /> */}
      <SubcategorySectionByCollection />
      <UserFeedback />
    </div>
  );
};

export default HomePageMain;
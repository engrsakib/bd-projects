import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const Whatsapp = () => {
    return (
        <div className='fixed md:bottom-5 bottom-[60px] right-0 md:right-5 z-50 size-14 bg-transparent'>
            <Link href={'https://wa.me/8801834956470'} target='_blank' rel='noopener noreferrer'>
                <Image
                    alt='whatsapp'
                    src={'/whatsapp.png'}
                    width={80}
                    height={80}
                    className='md:size-auto size-[50px]'
                />
            </Link>
        </div>
    );
};

export default Whatsapp;
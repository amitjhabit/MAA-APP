import React from 'react'
import picknic_img1 from '../piknic/picknicImage/img-1.jpg'
import picknic_img2 from '../piknic/picknicImage/img-2.jpg'
import picknic_img3 from '../piknic/picknicImage/img-3.jpg'
import picknic_img4 from '../piknic/picknicImage/img-4.jpg'
import picknic_img5 from '../piknic/picknicImage/img-5.jpg'
import picknic_img6 from '../piknic/picknicImage/img-6.jpg'
import { Link } from 'react-router-dom';
import './PicknicDetails.css';
import Footer from '../Footer';

const PicknicDetails = () => {
  return (
    <>
    <div className='picknics_details'>
    <div className='picknics_container'>
        <h3>Picnic Details</h3>
        <p>
            A picnic is a social event that typically involves sharing a meal outdoors.
            It is a wonderful way to enjoy nature, spend time with family and friends,
            and take a break from the hustle and bustle of daily life.
        </p>
        <div className='picknics_main'>
            <span>Date: 12 May 2024</span>
            <div className='picknics_img'>
                <img src={picknic_img1} alt=''/>
            </div>

            <div className='picknics_img'>
                <img src={picknic_img2} alt=''/>
            </div>

            <div className='picknics_img'>
                <img src={picknic_img3} alt=''/>
            </div>

            <div className='picknics_img'>
                <img src={picknic_img4} alt=''/>
            </div>

            <div className='picknics_img'>
                <img src={picknic_img5} alt=''/>
            </div>

            <div className='picknics_img'>
                <img src={picknic_img6} alt=''/>
            </div>
        </div>
        <Link to='/news'>Back</Link>
    </div>
</div>
<Footer/>
</>
  )
}

export default PicknicDetails
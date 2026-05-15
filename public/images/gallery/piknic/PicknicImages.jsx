import React from 'react'
import { Link } from 'react-router-dom'
import picnic_image1 from '../piknic/picknicImage/img-1.jpg';
import picnic_image2 from '../piknic/picknicImage/img-2.jpg';
import picnic_image3 from '../piknic/picknicImage/img-3.jpg';
import picnic_image4 from '../piknic/picknicImage/img-4.jpg';
import picnic_image5 from '../piknic/picknicImage/img-5.jpg';
import picnic_image6 from '../piknic/picknicImage/img-6.jpg';
import picnic_image7 from '../piknic/picknicImage/img-7.jpg';
import picnic_image8 from '../piknic/picknicImage/img-8.jpg';
import picnic_image9 from '../piknic/picknicImage/img-9.jpg';
import './PicknicImages.css';
import Footer from '../Footer';

const PicknicImages = () => {
  return (
    <>
    <div className='picknics_Images'>
    <h2> Picknic Images</h2>
    <div className='picknicsImage_container'>
        <div className='picknicsImage-main'>
            <img src={picnic_image1} alt=''/>
        </div>

        <div className='picknicsImage-main'>
            <img src={picnic_image2} alt=''/>
        </div>

        <div className='picknicsImage-main'>
            <img src={picnic_image3} alt=''/>
        </div>

        <div className='picknicsImage-main'>
            <img src={picnic_image4} alt=''/>
        </div>

        <div className='picknicsImage-main'>
            <img src={picnic_image5} alt=''/>
        </div>

        <div className='picknicsImage-main'>
            <img src={picnic_image6} alt=''/>
        </div>

        <div className='picknicsImage-main'>
            <img src={picnic_image7} alt=''/>
        </div>

        <div className='picknicsImage-main'>
            <img src={picnic_image8} alt=''/>
        </div>

        <div className='picknicsImage-main'>
            <img src={picnic_image9} alt=''/>
        </div>
        
    </div>
    <Link to='/news'>Back</Link>
</div>
<Footer/>
</>
  )
}

export default PicknicImages
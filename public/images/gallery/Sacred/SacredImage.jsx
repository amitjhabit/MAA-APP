import React from 'react'
import { Link } from 'react-router-dom';
import sacred_img1 from '../Sacred/SacredImages/Img-2.jpg';
import sacred_img2 from '../Sacred/SacredImages/Img-5.jpg';
import sacred_img3 from '../Sacred/SacredImages/Img-1.jpeg';
import sacred_img4 from '../Sacred/SacredImages/Img-3.jpeg';
import sacred_img5 from '../Sacred/SacredImages/Img-4.jpeg';
import sacred_img6 from '../Sacred/SacredImages/Img-7.jpg';
import './SacredImage.css';
import Footer from '../Footer';

const SacredImage = () => {
  return (
    <>
    <div className='sacred_Images'>
        <h2>Sacred Hearts Images</h2>
        <div className='sacredImage_container'>
            <div className='sacredImage-main'>
                <img src={sacred_img1} alt=''/>
            </div>

            <div className='sacredImage-main'>
                <img src={sacred_img2} alt=''/>
            </div>

            <div className='sacredImage-main'>
                <img src={sacred_img3} alt=''/>
            </div>

             <div className='sacredImage-main'>
                <img src={sacred_img4} alt=''/>
            </div>

             <div className='sacredImage-main'>
                <img src={sacred_img5} alt=''/>
            </div>

             <div className='sacredImage-main'>
                <img src={sacred_img6} alt=''/>
            </div>
            
        </div>
        <Link to='/news'>Back</Link>
    </div>
    <Footer/>
    </>
  )
}

export default SacredImage
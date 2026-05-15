import React from 'react'
import { Link } from 'react-router-dom';
import speechCompetition_image1 from '../SpeechCompetition/SpeechCompetitionImage/img-1.jpg';
import speechCompetition_image2 from '../SpeechCompetition/SpeechCompetitionImage/img-2.jpg';
import speechCompetition_image3 from '../SpeechCompetition/SpeechCompetitionImage/img-3.jpg';
import speechCompetition_image4 from '../SpeechCompetition/SpeechCompetitionImage/img-4.jpg';
import speechCompetition_image5 from '../SpeechCompetition/SpeechCompetitionImage/img-5.jpg';
import speechCompetition_image6 from '../SpeechCompetition/SpeechCompetitionImage/img-6.jpg';
// import diwali_image2 from '../diwali/diwaliImages/img-6.jpg';
import './SpeechCompetitionImage.css';
import Footer from '../Footer';

const SpeechCompetitionImage = () => {
  return (
    <>
    <div className='speech_Images'>
        <h2>Speech Competition Images</h2>
        <div className='speechImage_container'>
            <div className='speechImage-main'>
                <img src={speechCompetition_image1} alt=''/>
            </div>

            <div className='speechImage-main'>
                <img src={speechCompetition_image2} alt=''/>
            </div>

            <div className='speechImage-main'>
                <img src={speechCompetition_image3} alt=''/>
            </div>

             <div className='speechImage-main'>
                <img src={speechCompetition_image4} alt=''/>
            </div>

             <div className='speechImage-main'>
                <img src={speechCompetition_image5} alt=''/>
            </div>

             <div className='speechImage-main'>
                <img src={speechCompetition_image6} alt=''/>
            </div>
        </div>
        <Link to='/news'>Back</Link>
    </div>
    <Footer/>
    </>
  )
}

export default SpeechCompetitionImage
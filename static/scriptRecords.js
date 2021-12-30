function selectTab(event)
{
    let buttons = document.querySelectorAll('.difficultyButton');

    for (button of buttons)
    {
        button.className = button.className.replace(' active', '');
    }

    let triggerObject = event.srcElement;
    triggerObject.className += ' active';
    showTab(triggerObject.name);
}

function showTab(selectedTab)
{
    let tabData = document.getElementsByClassName('difficultyTab');

    // First, hide all of the content related to any of the tabs
    for (let i = 0; i < tabData.length; i++)
    {
        tabData[i].style.display = 'none';
    }

    // Then, show the content of the selected tab
    document.getElementById(selectedTab).style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function(){
    let buttons = document.querySelectorAll('.difficultyButton');

    for (button of buttons)
    {
        button.addEventListener('click', selectTab);
    }

    // Parse the url for the difficulty parameter, if applicable
    let queryString = window.location.search;
    let parameters = new URLSearchParams(queryString);
    let difficulty = parameters.get('difficulty');

    // If the difficulty parameter has the value 'easy' or 'hard', show the records of the respective difficulty, otherwise revert to the records of the 'medium' difficulty
    if (difficulty == 'easy')
    {
        document.querySelector('#easyButton').click();
    }
    else if (difficulty == 'hard')
    {
        document.querySelector('#hardButton').click();
    }
    else
    {
        document.querySelector('#mediumButton').click();
    }
})